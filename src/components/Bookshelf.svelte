<script lang="ts">
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";

  // The books array fetched from Astro content collection
  export let books: any[] = [];

  // Sort states
  let sortBy: "readDate" | "publishDate" | "title" | "author" = "readDate";
  let sortDesc = true;

  // Filter states
  let selectedTags: string[] = [];
  let tagsFilterMode: "OR" | "AND" = "OR";

  // Derive unique tags from the dataset
  $: allTags = Array.from(
    new Set(books.flatMap((book) => book.data.tags || [])),
  ).sort();

  // Pseudo-random number generator based on a string seed (for consistent book heights/colors)
  function hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  function getBookStyle(book: any) {
    const hash = hashString(book.id + book.data.title);

    // Thickness based on page count (min 30px, max 80px roughly)
    const thickness = Math.max(
      40,
      Math.min(100, (book.data.pageCount || 300) / 8),
    );

    // Height between 220px and 320px
    const height = 220 + (hash % 100);

    // Use theme colors for a perfectly cohesive palette
    const themeColors = ['var(--accent)', 'var(--accent-2)', 'var(--muted)', 'var(--fg)'];
    const baseColor = themeColors[hash % themeColors.length];
    
    // Mix the base color with the background to create varying shades
    const mixPercent = 20 + (hash % 60); // 20% to 80% base color
    const color = `color-mix(in srgb, ${baseColor} ${mixPercent}%, var(--bg))`;

    // Use background color for text on heavily mixed books, and foreground color for lightly mixed ones
    const textColor = mixPercent > 50 ? 'var(--bg)' : 'var(--fg)';

    // Let spines stretch width and height just a little, to make sure long titles fit
    return `
      min-width: ${thickness}px;
      max-width: ${thickness + 20}px;
      min-height: ${height}px;
      max-height: ${height + 20}px;
      background-color: ${color};
      color: ${textColor};
    `;
  }

  // Reactive sorted and filtered books
  $: processedBooks = [...books]
    .filter(
      (book) =>
        selectedTags.length === 0 ||
        (tagsFilterMode === "OR"
          ? book.data.tags &&
            selectedTags.some((tag) => book.data.tags.includes(tag))
          : book.data.tags &&
            selectedTags.every((tag) => book.data.tags.includes(tag))),
    )
    .sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case "title":
          valA = a.data.title;
          valB = b.data.title;
          break;
        case "author":
          valA = a.data.author.substring(a.data.author.indexOf(" ") + 1);
          valB = b.data.author.substring(b.data.author.indexOf(" ") + 1);
          break;
        case "publishDate":
          valA = new Date(a.data.publishDate).getTime();
          valB = new Date(b.data.publishDate).getTime();
          break;
        case "readDate":
        default:
          valA = new Date(
            a.data.readDateFinish || a.data.readDateStart,
          ).getTime();
          valB = new Date(
            b.data.readDateFinish || b.data.readDateStart,
          ).getTime();
          break;
      }

      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      if (valA == valB) {
        return new Date(a.data.publishDate).getTime() <
          new Date(b.data.publishDate).getTime()
          ? -1
          : 1;
      }
      return 0;
    });

  function truncateAuthor(author: string) {
    if (author.includes(",")) {
      return author.substring(0, author.indexOf(",")) + ", et al.";
    }
    return author;
  }

  // Modal State
  let selectedBook: any = null;

  function openBook(book: any) {
    selectedBook = book;
  }

  function closeBook() {
    selectedBook = null;
  }
</script>

<div class="bookshelf-container">
  <!-- Controls -->
  <div class="controls">
    <div class="sort-controls">
      <label for="sort">Sort by:</label>
      <select id="sort" bind:value={sortBy}>
        <option value="readDate">Read Date</option>
        <option value="publishDate">Publish Date</option>
        <option value="title">Title</option>
        <option value="author">Author</option>
      </select>
      <button on:click={() => (sortDesc = !sortDesc)}>
        {sortDesc ? "⬇️" : "⬆️"}
      </button>
    </div>

    <div class="filter-controls">
      <span class="tag-label">Filter tags:</span>
      <button
        on:click={() =>
          (tagsFilterMode = tagsFilterMode === "OR" ? "AND" : "OR")}
      >
        {tagsFilterMode}
      </button>
      <button
        class="tag-btn {selectedTags.length === 0 ? 'active' : ''}"
        on:click={() => (selectedTags = [])}
      >
        All
      </button>
      {#each allTags as tag}
        <button
          class="tag-btn {selectedTags.includes(tag) ? 'active' : ''}"
          on:click={() =>
            (selectedTags = selectedTags.includes(tag)
              ? selectedTags.filter((t) => t !== tag)
              : [...selectedTags, tag])}
        >
          {tag}
        </button>
      {/each}
    </div>
  </div>

  <!-- The Shelf -->
  <div class="shelf">
    {#each processedBooks as book (book.id)}
      <div class="book-wrapper" animate:flip={{ duration: 400 }}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="book-spine"
          style={getBookStyle(book)}
          on:click={() => openBook(book)}
        >
          <div class="spine-content">
            <span class="spine-title">{book.data.title}</span>
            <span class="spine-author">{truncateAuthor(book.data.author)}</span>
          </div>
        </div>
      </div>
    {/each}
    {#if processedBooks.length === 0}
      <div class="empty-state">No books found for this tag.</div>
    {/if}
  </div>
</div>

<!-- Foreground Detail Modal -->
{#if selectedBook}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="modal-backdrop"
    transition:fade={{ duration: 200 }}
    on:click={closeBook}
  >
    <div class="modal-content" on:click|stopPropagation>
      <button class="close-btn" on:click={closeBook}>&times;</button>

      <div class="book-details">
        <div
          class="book-cover-placeholder"
          style="background-color: {getBookStyle(selectedBook).match(
            /background-color: ([^;]+);/,
          )?.[1] || '#e2e8f0'}"
        >
          {#if selectedBook.data.coverUrl}
            <img
              src={selectedBook.data.coverUrl}
              alt="Cover of {selectedBook.data.title}"
            />
          {:else}
            <div class="placeholder-text">{selectedBook.data.title}</div>
          {/if}
        </div>

        <div class="book-info">
          <h2>{selectedBook.data.title}</h2>
          <h3 class="author">by {selectedBook.data.author}</h3>

          <div class="metadata">
            <p><strong>Pages:</strong> {selectedBook.data.pageCount}</p>
            <p>
              <strong>Published:</strong>
              {new Date(selectedBook.data.publishDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Read:</strong>
              {new Date(selectedBook.data.readDateStart).toLocaleDateString()}
              {#if selectedBook.data.readDateFinish}
                - {new Date(
                  selectedBook.data.readDateFinish,
                ).toLocaleDateString()}
              {/if}
            </p>
          </div>

          <div class="tags">
            {#each selectedBook.data.tags || [] as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .bookshelf-container {
    width: 80vw;
    margin-left: calc(50% - 40vw);
    padding: 2rem;
    /* font-family: "Inter", sans-serif; */
    box-sizing: border-box;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 3rem;
    background: color-mix(in srgb, var(--bg) 95%, var(--fg));
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid var(--muted);
  }

  .sort-controls,
  .filter-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  select {
    padding: 0.5rem;
    border-radius: 6px;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--muted);
  }

  button {
    background: var(--bg);
    border: 1px solid var(--muted);
    color: var(--fg);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:hover {
    background: var(--muted);
    color: var(--bg);
  }

  .tag-btn {
    font-size: 0.8rem;
    border-radius: 999px;
  }

  .tag-btn.active {
    background: var(--accent);
    border-color: var(--bg);
    color: var(--bg);
  }

  .shelf {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    align-items: flex-start;
    justify-content: center;
    padding: 0rem 1rem;

    /* The literal shelf visual repeating every 380px */
    border-radius: 4px;
    background: repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent 362px,
        var(--accent) 362px,
        var(--accent) 380px
      ),
      repeating-linear-gradient(
        to bottom,
        transparent 0,
        color-mix(in srgb, var(--muted) 30%, transparent) 362px,
        transparent 362px,
        transparent 380px
      );
    min-height: 380px;
  }

  .book-wrapper {
    height: 380px;
    padding-bottom: 18px; /* space for the shelf background */
    padding-left: 1px;
    padding-right: 1px;
    display: flex;
    align-items: flex-end;
  }

  .book-spine {
    cursor: pointer;
    border-radius: 3px 3px 2px 2px;
    box-shadow:
      inset 4px 0 10px rgba(0, 0, 0, 0.1),
      inset -2px 0 5px rgba(255, 255, 255, 0.1),
      2px 0 5px rgba(0, 0, 0, 0.3);
    font-family: "Inter", sans-serif;
    position: relative;
    transition:
      transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
      margin 0.3s ease,
      z-index 0s;
    transform-origin: bottom center;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 0;
    overflow: hidden;
  }

  .book-spine:hover {
    transform: scale(1.08) translateY(-10px);
    z-index: 10;
    box-shadow:
      0 10px 20px rgba(0, 0, 0, 0.4),
      inset 4px 0 10px rgba(0, 0, 0, 0.1);
  }

  .spine-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    transform: rotate(180deg); /* Make text read top to bottom */
  }

  .spine-title {
    font-weight: 700;
    font-size: 1.1rem;
    /*max-height: 65%;*/
    padding-bottom: 10px;
    letter-spacing: 0.5px;
    line-height: 1;
    /*
    text-overflow: ellipsis;
    overflow: hidden;*/
  }

  .spine-author {
    font-size: 0.75rem;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
    /*max-height: 35%;*/
    text-align: right;
  }

  .empty-state {
    width: 100%;
    text-align: center;
    padding: 2rem;
    color: var(--muted);
    font-style: italic;
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: color-mix(in srgb, var(--bg) 80%, transparent);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal-content {
    background: var(--bg);
    border: 1px solid var(--muted);
    padding: 2.5rem;
    border-radius: 16px;
    width: 90%;
    max-width: 800px;
    position: relative;
    box-shadow: 0 25px 50px -12px color-mix(in srgb, var(--fg) 50%, transparent);
    color: var(--fg);
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--muted);
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    color: var(--fg);
    background: color-mix(in srgb, var(--fg) 10%, transparent);
  }

  .book-details {
    display: flex;
    gap: 2.5rem;
    flex-wrap: wrap;
  }

  .book-cover-placeholder {
    width: 200px;
    height: 300px;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1rem;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.8);
    overflow: hidden;
    flex-shrink: 0;
  }

  .book-cover-placeholder img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .book-info {
    flex: 1;
    min-width: 300px;
  }

  .book-info h2 {
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
  }

  .book-info .author {
    font-size: 1.2rem;
    color: var(--muted);
    font-weight: 400;
    margin: 0 0 2rem 0;
  }

  .metadata {
    background: color-mix(in srgb, var(--muted) 20%, transparent);
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .metadata p {
    margin: 0.5rem 0;
    color: var(--fg);
  }

  .metadata strong {
    color: var(--accent);
    display: inline-block;
    width: 100px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    background: var(--muted);
    padding: 0.3rem 0.8rem;
    border-radius: 999px;
    font-size: 0.8rem;
    color: var(--bg);
  }

  @media (max-width: 768px) {
    .book-details {
      gap: 1.5rem;
      justify-content: center;
    }
    .book-info {
      text-align: center;
    }
    .metadata strong {
      width: auto;
      margin-right: 0.5rem;
    }
  }
</style>
