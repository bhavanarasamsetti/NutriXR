import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Community.css";

const initialRecipes = [
  {
    id: "r1",
    title: "Citrus Sunrise Salad",
    author: "Maya",
    likes: 18,
    tags: ["citrus", "breakfast"],
    ingredients: "Orange, grapefruit, mint, yogurt",
    steps: "Slice fruit, mix with yogurt, top with mint.",
    createdAt: "2h ago"
  },
  {
    id: "r2",
    title: "Berry Oat Bowl",
    author: "Rohan",
    likes: 33,
    tags: ["berry", "fiber"],
    ingredients: "Oats, blueberries, strawberries, chia",
    steps: "Cook oats, add berries, sprinkle chia.",
    createdAt: "1d ago"
  }
];

const initialDiscussions = [
  {
    id: "d1",
    author: "Lina",
    text: "Best fruit for a post-workout snack?",
    createdAt: "10m ago"
  },
  {
    id: "d2",
    author: "Jay",
    text: "Anyone tried mango with lime and chili?",
    createdAt: "45m ago"
  }
];

export default function Community() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("recipes");
  const [search, setSearch] = useState("");
  const [recipes, setRecipes] = useState(initialRecipes);
  const [discussions, setDiscussions] = useState(initialDiscussions);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    ingredients: "",
    steps: "",
    tags: ""
  });
  const [message, setMessage] = useState("");

  const stats = {
    members: 2847,
    shared: recipes.length,
    discussions: discussions.length,
    active: 847
  };

  const filteredRecipes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return recipes;
    return recipes.filter((recipe) => {
      const inTitle = recipe.title.toLowerCase().includes(term);
      const inTags = recipe.tags.some((tag) => tag.toLowerCase().includes(term));
      const inAuthor = recipe.author.toLowerCase().includes(term);
      return inTitle || inTags || inAuthor;
    });
  }, [recipes, search]);

  const filteredDiscussions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return discussions;
    return discussions.filter((item) => {
      const inText = item.text.toLowerCase().includes(term);
      const inAuthor = item.author.toLowerCase().includes(term);
      return inText || inAuthor;
    });
  }, [discussions, search]);

  const trendingRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => b.likes - a.likes).slice(0, 5);
  }, [recipes]);

  const handleShareRecipe = (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;

    const tagList = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const newRecipe = {
      id: `r${Date.now()}`,
      title,
      author: "You",
      likes: 0,
      tags: tagList,
      ingredients: form.ingredients.trim() || "",
      steps: form.steps.trim() || "",
      createdAt: "just now"
    };

    setRecipes((prev) => [newRecipe, ...prev]);
    setForm({ title: "", ingredients: "", steps: "", tags: "" });
    setShowModal(false);
    setTab("recipes");
  };

  const handlePostMessage = (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    const post = {
      id: `d${Date.now()}`,
      author: "You",
      text,
      createdAt: "just now"
    };
    setDiscussions((prev) => [post, ...prev]);
    setMessage("");
  };

  const handleLike = (recipeId) => {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, likes: recipe.likes + 1 }
          : recipe
      )
    );
  };

  return (
    <div className="community-page">
      <header className="community-topbar">
        <div className="community-topbar-left">
          <button className="community-back" type="button" onClick={() => navigate("/dashboard")}>
            <span className="icon-circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M14.5 6.5l-5 5 5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Back
          </button>
          <div className="community-title">
            <span className="community-title-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 3l1.6 4.6 4.8.1-3.8 2.8 1.4 4.5-4-2.7-4 2.7 1.4-4.5-3.8-2.8 4.8-.1L12 3z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Community
          </div>
        </div>
        <button className="community-share" type="button" onClick={() => setShowModal(true)}>
          <span className="share-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 5v14M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Share
        </button>
      </header>

      <section className="community-stats">
        <div className="stat-card">
          <div>
            <div className="stat-label">Community Members</div>
            <div className="stat-value">{stats.members.toLocaleString()}</div>
          </div>
          <div className="stat-icon stat-icon-blue" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M16 11a4 4 0 10-8 0 4 4 0 008 0zm-10 9a6 6 0 0112 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Shared Recipes</div>
            <div className="stat-value">{stats.shared}</div>
          </div>
          <div className="stat-icon stat-icon-green" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M6 12a3 3 0 103-3m6 9a3 3 0 100-6m-6 0h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Discussions</div>
            <div className="stat-value">{stats.discussions}</div>
          </div>
          <div className="stat-icon stat-icon-purple" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M20 12a7 7 0 01-7 7H7l-3 3v-5a7 7 0 017-7h2a7 7 0 017 7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Active This Week</div>
            <div className="stat-value">{stats.active}</div>
          </div>
          <div className="stat-icon stat-icon-orange" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 4l3 3 4 .6-3 3 .7 4-4.7-2.2L7.3 14l.7-4-3-3L9 7l3-3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </section>

      <section className="community-search">
        <div className="search-shell">
          <div className="search-input-wrap">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className="search-input"
              placeholder="Search recipes, discussions, members..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button className="filter-btn" type="button">
            <span className="filter-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M4 6h16l-6 7v4l-4 2v-6L4 6z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Filters
          </button>
        </div>
      </section>

      <section className="community-tabs">
        <button
          type="button"
          className={`tab-btn ${tab === "recipes" ? "active" : ""}`}
          onClick={() => setTab("recipes")}
        >
          <span className="tab-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M6 12a3 3 0 103-3m6 9a3 3 0 100-6m-6 0h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Recipes ({recipes.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === "discussions" ? "active" : ""}`}
          onClick={() => setTab("discussions")}
        >
          <span className="tab-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M20 12a7 7 0 01-7 7H7l-3 3v-5a7 7 0 017-7h2a7 7 0 017 7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Discussions ({discussions.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === "trending" ? "active" : ""}`}
          onClick={() => setTab("trending")}
        >
          <span className="tab-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M5 15l5-5 4 4 5-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Trending
        </button>
      </section>

      <section className="community-body">
        <div className="community-main">
          {tab === "recipes" && (
            <div className="panel">
              {filteredRecipes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-title">No recipes yet</div>
                  <div className="empty-sub">Be the first to share a recipe with the community.</div>
                  <button className="primary-btn" type="button" onClick={() => setShowModal(true)}>
                    Add Recipe
                  </button>
                </div>
              ) : (
                <div className="recipe-list">
                  {filteredRecipes.map((recipe) => (
                    <article className="recipe-card" key={recipe.id}>
                      <div className="recipe-head">
                        <div>
                          <h3>{recipe.title}</h3>
                          <div className="recipe-meta">By {recipe.author} · {recipe.createdAt}</div>
                        </div>
                        <button className="like-btn" type="button" onClick={() => handleLike(recipe.id)}>
                          Like ({recipe.likes})
                        </button>
                      </div>
                      <div className="recipe-tags">
                        {recipe.tags.map((tag) => (
                          <span className="tag" key={`${recipe.id}-${tag}`}>{tag}</span>
                        ))}
                      </div>
                      {recipe.ingredients && (
                        <p><strong>Ingredients:</strong> {recipe.ingredients}</p>
                      )}
                      {recipe.steps && (
                        <p><strong>Steps:</strong> {recipe.steps}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "discussions" && (
            <div className="panel">
              {filteredDiscussions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-title">No discussions yet</div>
                  <div className="empty-sub">Start a chat and share your question.</div>
                </div>
              ) : (
                <div className="discussion-list">
                  {filteredDiscussions.map((post) => (
                    <article className="discussion-card" key={post.id}>
                      <div className="discussion-meta">{post.author} · {post.createdAt}</div>
                      <p>{post.text}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "trending" && (
            <div className="panel">
              {trendingRecipes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-title">No trending recipes</div>
                  <div className="empty-sub">Recipes will appear here once they receive likes.</div>
                </div>
              ) : (
                <div className="recipe-list">
                  {trendingRecipes.map((recipe, index) => (
                    <article className="recipe-card" key={recipe.id}>
                      <div className="recipe-head">
                        <div>
                          <h3>{index + 1}. {recipe.title}</h3>
                          <div className="recipe-meta">By {recipe.author} · {recipe.likes} likes</div>
                        </div>
                        <button className="like-btn" type="button" onClick={() => handleLike(recipe.id)}>
                          Like
                        </button>
                      </div>
                      {recipe.tags.length > 0 && (
                        <div className="recipe-tags">
                          {recipe.tags.map((tag) => (
                            <span className="tag" key={`${recipe.id}-${tag}`}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="community-side">
          {tab === "discussions" && (
            <div className="panel">
              <div className="panel-title">Discussion Chat</div>
              <div className="chat-list">
                {discussions.map((post) => (
                  <div className="chat-item" key={`chat-${post.id}`}>
                    <div className="chat-author">{post.author}</div>
                    <div className="chat-text">{post.text}</div>
                    <div className="chat-time">{post.createdAt}</div>
                  </div>
                ))}
              </div>
              <form className="chat-input" onSubmit={handlePostMessage}>
                <input
                  type="text"
                  placeholder="Share a thought with the community..."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <button type="submit">Post</button>
              </form>
            </div>
          )}

          {(tab === "recipes" || tab === "trending") && (
            <div className="panel">
              <div className="panel-title">Trending Recipes</div>
              <div className="trending-list">
                {trendingRecipes.map((recipe) => (
                  <div className="trending-item" key={`trend-${recipe.id}`}>
                    <div>
                      <div className="trending-title">{recipe.title}</div>
                      <div className="trending-meta">{recipe.likes} likes</div>
                    </div>
                    <button className="ghost-btn" type="button" onClick={() => handleLike(recipe.id)}>
                      Like
                    </button>
                  </div>
                ))}
                {trendingRecipes.length === 0 && (
                  <div className="empty-sub">No recipes yet.</div>
                )}
              </div>
            </div>
          )}
        </aside>
      </section>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Add a Recipe</h3>
              <button className="ghost-btn" type="button" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
            <form className="modal-form" onSubmit={handleShareRecipe}>
              <label>
                Recipe title
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </label>
              <label>
                Ingredients
                <textarea
                  rows="3"
                  value={form.ingredients}
                  onChange={(event) => setForm((prev) => ({ ...prev, ingredients: event.target.value }))}
                />
              </label>
              <label>
                Steps
                <textarea
                  rows="4"
                  value={form.steps}
                  onChange={(event) => setForm((prev) => ({ ...prev, steps: event.target.value }))}
                />
              </label>
              <label>
                Tags (comma separated)
                <input
                  type="text"
                  value={form.tags}
                  onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                />
              </label>
              <div className="modal-actions">
                <button className="ghost-btn" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="primary-btn" type="submit">
                  Add Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
