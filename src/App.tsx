import {
  useState,
  useEffect,
  createContext,
  useContext,
  type FormEvent,
} from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { store, money, launched, siteUrl, storageKey } from "./config";
import { api, auth } from "./lib/client";
import { type Product, productSchema } from "./lib/models";
import {
  customerSchema,
  EMPTY_CUSTOMER,
  PROVINCES,
  readSession,
  saveSession,
  CHECKOUT_DRAFT,
} from "./lib/checkout";
import { CartProvider, useCart } from "./Cart";
export type Catalog = {
  products: Product[];
  checkoutEnabled: boolean;
  ready: boolean;
  shippingCents?: number;
};
const CatalogContext = createContext<Catalog>({
  products: [],
  checkoutEnabled: false,
  ready: false,
});
const useCatalog = () => useContext(CatalogContext);
function Arrow() {
  return <span aria-hidden="true">↗</span>;
}
function Empty({
  title = "A little patience. A thoughtful collection.",
  text = "We’re preparing our first skincare collection. Explore the details here when it arrives.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <span className="seed" aria-hidden="true">
        ✳
      </span>
      <p className="eyebrow">IN THE MAKING</p>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="text-link" to="/">
        Back to {store.name} <Arrow />
      </Link>
    </div>
  );
}
function Header() {
  const { items } = useCart();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  return (
    <>
      <div className="announcement">
        {launched
          ? "Everyday, considered."
          : "A new daily ritual is taking shape. Coming soon."}
      </div>
      <header>
        <Link to="/" className="wordmark" aria-label={`${store.name} home`}>
          {store.name.toLowerCase()}
          <span aria-hidden="true">✳</span>
        </Link>
        <button
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav
          id="navigation"
          className={open ? "open" : ""}
          aria-label="Main navigation"
        >
          <NavLink to="/shop">The collection</NavLink>
          <NavLink to="/about">Our approach</NavLink>
          <NavLink to="/faq">Good to know</NavLink>
        </nav>
        <div className="header-actions">
          <Link to="/account" aria-label="Your account">
            <svg
              width="20"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              aria-hidden="true"
            >
              <circle cx="12" cy="7" r="3.5" />
              <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
            </svg>
          </Link>
          <Link
            to="/cart"
            aria-label={`Bag, ${items.reduce((n, v) => n + v.qty, 0)} items`}
          >
            Bag{" "}
            <span className="bag-count">
              {items.reduce((n, v) => n + v.qty, 0)}
            </span>
          </Link>
        </div>
      </header>
    </>
  );
}
function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="dot" /> A MORE CONSIDERED EVERYDAY
          </p>
          <h1>
            Make room
            <br />
            for a little
            <br />
            <em>stillness.</em>
          </h1>
          <p className="hero-description">
            Skincare. A small daily ritual.
            <br />A moment that belongs to you.
          </p>
          <Link className="button" to="/shop">
            Discover what’s next <Arrow />
          </Link>
          <span className="hero-note">
            Our first collection is coming soon.
          </span>
        </div>
        <div className="hero-art">
          <img
            src="/stillness.svg"
            alt="An abstract glass sphere and curved stone forms in soft afternoon light"
          />
          <div className="art-caption">
            <span>THE ART OF TAKING A MOMENT</span>
            <span>01 / {store.name.toUpperCase()}</span>
          </div>
          <div className="round-seal" aria-hidden="true">
            SLOW DOWN
            <br />
            <span>✳</span>
            <br />
            SETTLE IN
          </div>
        </div>
      </section>
      <div className="marquee" aria-hidden="true">
        <span>Less rush.</span>
        <i>✳</i>
        <span>More ritual.</span>
        <i>✳</i>
        <span>A little stillness.</span>
        <i>✳</i>
        <span>Every day.</span>
      </div>
      <section className="approach section">
        <p className="eyebrow">A NOTE FROM {store.name.toUpperCase()}</p>
        <div>
          <h2>
            Good habits start
            <br />
            with <em>small moments.</em>
          </h2>
          <p>
            We’re building a space for everyday skincare, with room to pause. A
            considered collection, clear product information, and a routine you
            can make your own.
          </p>
          <Link className="text-link" to="/about">
            Meet our approach <Arrow />
          </Link>
        </div>
        <span className="approach-mark" aria-hidden="true">
          sf.
        </span>
      </section>
      <section className="section rituals">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR ROUTINE, YOUR PACE</p>
            <h2>A ritual in three parts.</h2>
          </div>
          <Link className="text-link" to="/shop">
            Explore the collection <Arrow />
          </Link>
        </div>
        <div className="ritual-grid">
          {[
            ["01", "Cleanse", "Begin with a fresh canvas.", "cleanse"],
            ["02", "Treat", "A moment for the details.", "treat"],
            ["03", "Moisturise", "The finishing touch.", "moisturise"],
          ].map(([n, title, text, slug]) => (
            <Link
              className={`ritual-card ${slug}`}
              to={`/shop?collection=${slug}`}
              key={n}
            >
              <div className="ritual-art" aria-hidden="true">
                <span className="ritual-number">{n}</span>
                <div className="form-sculpture" />
                <span className="small-label">COLLECTION COMING SOON</span>
              </div>
              <div className="ritual-label">
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <Arrow />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="closing">
        <p className="eyebrow">SOMETHING GOOD TAKES TIME</p>
        <h2>
          A fresh chapter.
          <br />
          <em>Taking shape.</em>
        </h2>
        <p>
          Our collection is in the making.
          <br />
          Come back soon to discover the first arrivals.
        </p>
        <Link className="button light" to="/faq">
          A few things to know <Arrow />
        </Link>
      </section>
    </>
  );
}
function Shop() {
  const { products } = useCatalog();
  const [params, setParams] = useSearchParams();
  const filter = params.get("collection") || "all";
  const visible = products.filter(
    (p) => filter === "all" || p.collection === filter,
  );
  return (
    <div className="page">
      <p className="eyebrow">EVERYDAY, CONSIDERED</p>
      <h1>The collection.</h1>
      <p className="intro">
        A place for your daily ritual. Our first collection is taking shape.
      </p>
      <div className="filters" aria-label="Filter collection">
        {["all", "cleanse", "treat", "moisturise"].map((v) => (
          <button
            key={v}
            className={v === filter ? "selected" : ""}
            aria-pressed={v === filter}
            onClick={() => setParams(v === "all" ? {} : { collection: v })}
          >
            {v === "all" ? "All skincare" : v}
          </button>
        ))}
      </div>
      {visible.length ? (
        <div className="product-grid">
          {visible.map((p) => (
            <Link to={`/products/${p.slug}`} key={p.id}>
              <img src={p.images[0].url} alt={p.images[0].alt} loading="lazy" />
              <h2>{p.title}</h2>
              <p>{money(Math.min(...p.variants.map((v) => v.price_cents)))}</p>
            </Link>
          ))}
        </div>
      ) : (
        <Empty />
      )}
    </div>
  );
}
function ProductPage() {
  const { slug } = useParams();
  const { products, checkoutEnabled } = useCatalog();
  const product = products.find((p) => p.slug === slug);
  const [variantId, setVariantId] = useState("");
  const cart = useCart();
  const [added, setAdded] = useState(false);
  if (!product)
    return (
      <div className="page">
        <Empty
          title="Something new is taking shape."
          text="Product details will appear here when our collection launches."
        />
      </div>
    );
  const variant =
    product.variants.find((v) => v.id === variantId) || product.variants[0];
  return (
    <div className="page product-page">
      <div className="gallery">
        {product.images.map((image, i) => (
          <img
            key={image.url}
            src={image.url}
            alt={image.alt}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>
      <div>
        <p className="eyebrow">{product.collection}</p>
        <h1>{product.title}</h1>
        <p>{product.description}</p>
        <label htmlFor="variant">Size / option</label>
        <select
          id="variant"
          value={variant.id}
          onChange={(e) => setVariantId(e.target.value)}
        >
          {product.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} · {v.size}
            </option>
          ))}
        </select>
        <p className="price">{money(variant.price_cents)}</p>
        <button
          className="button"
          disabled={!checkoutEnabled || variant.stock < 1 || product.demo}
          onClick={() => {
            cart.add({
              storeId: store.id,
              productId: product.id,
              variantId: variant.id,
              title: product.title,
              label: variant.label,
              image: product.images[0].url,
              unitPrice: variant.price_cents,
              qty: 1,
            });
            setAdded(true);
          }}
        >
          {!checkoutEnabled
            ? "Coming soon"
            : variant.stock < 1
              ? "Currently unavailable"
              : "Add to bag"}{" "}
          <Arrow />
        </button>
        <p role="status">
          {added ? <Link to="/cart">Added to your bag. View bag →</Link> : ""}
        </p>
        {[
          ["Ingredients", product.ingredients],
          ["How to use", product.usage],
          ["Delivery", product.delivery],
          ["Returns", store.returns],
        ].map(([title, text]) => (
          <details key={title}>
            <summary>{title}</summary>
            <p>{text}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
function CartPage() {
  const cart = useCart();
  const { checkoutEnabled } = useCatalog();
  return (
    <div className="page">
      <p className="eyebrow">YOUR DAILY RITUAL</p>
      <h1>Your bag.</h1>
      {!cart.items.length ? (
        <Empty
          title="A little room for something new."
          text="Your bag is empty. Our skincare collection is coming soon."
        />
      ) : (
        <>
          <div className="cart-lines">
            {cart.items.map((v) => (
              <div className="cart-line" key={v.variantId}>
                <img src={v.image} alt={v.title} />
                <div>
                  <h2>{v.title}</h2>
                  <p>{v.label}</p>
                  <label>
                    Quantity{" "}
                    <input
                      aria-label={`${v.title} quantity`}
                      type="number"
                      min="0"
                      max="20"
                      value={v.qty}
                      onChange={(e) =>
                        cart.quantity(v.variantId, Number(e.target.value))
                      }
                    />
                  </label>
                  <button
                    className="text-link"
                    onClick={() => cart.quantity(v.variantId, 0)}
                  >
                    Remove
                  </button>
                </div>
                <p>{money(v.unitPrice * v.qty)}</p>
              </div>
            ))}
          </div>
          <p>
            Estimated subtotal:{" "}
            {money(cart.items.reduce((n, v) => n + v.qty * v.unitPrice, 0))}
          </p>
          <p>
            Final pricing, availability and delivery are checked at checkout.
          </p>
          {checkoutEnabled ? (
            <Link className="button" to="/checkout">
              Continue to checkout <Arrow />
            </Link>
          ) : (
            <p>Orders are not open yet. Your bag is saved.</p>
          )}
        </>
      )}
    </div>
  );
}
type Draft = typeof EMPTY_CUSTOMER;
function Checkout() {
  const { checkoutEnabled, shippingCents } = useCatalog();
  const cart = useCart();
  const [details, setDetails] = useState<Draft>(() => ({
    ...EMPTY_CUSTOMER,
    ...readSession<Draft>(CHECKOUT_DRAFT),
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => saveSession(CHECKOUT_DRAFT, details), [details]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = customerSchema.safeParse(details);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      document.getElementById(String(parsed.error.issues[0].path[0]))?.focus();
      return;
    }
    setBusy(true);
    try {
      const fingerprint = JSON.stringify({
        customer: parsed.data,
        lines: cart.items.map((v) => ({ variantId: v.variantId, qty: v.qty })),
      });
      const saved = readSession<{ key: string; fingerprint: string }>(
        storageKey("payment-request"),
      );
      const requestKey =
        saved?.fingerprint === fingerprint ? saved.key : crypto.randomUUID();
      saveSession(storageKey("payment-request"), {
        key: requestKey,
        fingerprint,
      });
      const result = await api<{ redirectUrl: string }>("checkout", {
        requestKey,
        lines: cart.items.map((v) => ({ variantId: v.variantId, qty: v.qty })),
        customer: parsed.data,
      });
      window.location.assign(result.redirectUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout unavailable.");
      setBusy(false);
    }
  }
  if (!checkoutEnabled || !cart.items.length)
    return (
      <div className="page">
        <h1>Checkout.</h1>
        <Empty
          title="We’re getting ready."
          text="Checkout will open once our real products and delivery details are ready."
        />
      </div>
    );
  return (
    <div className="page narrow">
      <p className="eyebrow">YOUR DETAILS</p>
      <h1>A moment away.</h1>
      <p>
        Sign in first using the email below. Delivery:{" "}
        {shippingCents == null ? "To be confirmed" : money(shippingCents)}.
      </p>
      <Link to="/account" className="text-link">
        Sign in to your account →
      </Link>
      <form onSubmit={submit} noValidate>
        {Object.entries({
          fullName: "Full name",
          email: "Email",
          phone: "Phone",
          streetAddress: "Street address",
          suburb: "Suburb (optional)",
          city: "City",
          province: "Province",
          postalCode: "Postal code",
          notes: "Delivery notes (optional)",
        }).map(([key, label]) => (
          <label key={key} htmlFor={key}>
            {label}
            {key === "province" ? (
              <select
                id={key}
                value={details.province}
                onChange={(e) =>
                  setDetails((p) => ({ ...p, province: e.target.value }))
                }
              >
                <option value="">Choose province</option>
                {PROVINCES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            ) : (
              <input
                id={key}
                type={
                  key === "email" ? "email" : key === "phone" ? "tel" : "text"
                }
                value={details[key as keyof Draft]}
                onChange={(e) =>
                  setDetails((p) => ({ ...p, [key]: e.target.value }))
                }
              />
            )}
          </label>
        ))}
        <p role="alert">{error}</p>
        <button className="button" disabled={busy}>
          {busy ? "Preparing payment…" : "Continue to secure payment"} <Arrow />
        </button>
      </form>
    </div>
  );
}
type Order = {
  id: string;
  status: string;
  amount_cents: number;
  created_at: string;
  items: { title: string; label: string; qty: number }[];
};
function Account() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState("");
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!auth) return;
    const subscription = auth.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user.email || ""),
    );
    void auth.auth
      .getSession()
      .then((v) => setUser(v.data.session?.user.email || ""));
    return () => subscription.data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (user)
      void api<{ orders: Order[] }>("orders")
        .then((v) => setOrders(v.orders))
        .catch((e) => setMessage(e.message));
    else setOrders([]);
  }, [user]);
  async function signIn(e: FormEvent) {
    e.preventDefault();
    if (!auth) return;
    setBusy(true);
    const { error } = await auth.auth.signInWithPassword({ email, password });
    setMessage(
      error ? "Could not sign in. Check your email and password." : "",
    );
    setBusy(false);
  }
  async function signUp() {
    if (!auth) return;
    setBusy(true);
    const { error } = await auth.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${siteUrl()}/account` },
    });
    setMessage(
      error
        ? "Account creation unavailable. Please try again."
        : "Check your email to confirm your account.",
    );
    setBusy(false);
  }
  return (
    <div className="page narrow">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h1>Your account.</h1>
      {!auth ? (
        <Empty
          title="Accounts are being prepared."
          text="Account access will be available when the collection launches."
        />
      ) : user ? (
        <>
          <p>Signed in as {user}.</p>
          <button
            className="text-link"
            onClick={() => void auth?.auth.signOut()}
          >
            Sign out
          </button>
          <h2>Your {store.name} orders</h2>
          <p>
            Payment redirects do not confirm payment. Refresh orders to check
            confirmation.
          </p>
          <button
            className="text-link"
            onClick={() =>
              void api<{ orders: Order[] }>("orders")
                .then((v) => setOrders(v.orders))
                .catch((e) => setMessage(e.message))
            }
          >
            Refresh orders
          </button>
          {orders.length ? (
            orders.map((o) => (
              <article className="order" key={o.id}>
                <p>Order {o.id}</p>
                <h3>
                  {o.status} · {money(o.amount_cents)}
                </h3>
                {o.items.map((v, i) => (
                  <p key={i}>
                    {v.qty} × {v.title} · {v.label}
                  </p>
                ))}
              </article>
            ))
          ) : (
            <p>You have no orders in this store yet.</p>
          )}
        </>
      ) : (
        <>
          <p>
            Use your existing customer sign-in, or create an account. This page
            shows only your {store.name} orders.
          </p>
          <form onSubmit={signIn}>
            <label>
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                minLength={8}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="button" disabled={busy}>
              Sign in <Arrow />
            </button>
            <button
              type="button"
              className="text-link"
              disabled={busy || !email || password.length < 8}
              onClick={() => void signUp()}
            >
              Create an account
            </button>
          </form>
        </>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
function About() {
  return (
    <div className="page narrow">
      <p className="eyebrow">OUR APPROACH</p>
      <h1>
        A little less rush.
        <br />
        <em>A little more ritual.</em>
      </h1>
      <p className="intro">
        Skincare is a daily practice. We’re making room for it.
      </p>
      <p>
        {store.name} is a new skincare storefront in the making. Our first
        collection will bring together products with clear ingredient lists,
        straightforward usage guidance, and the details you need to choose your
        routine.
      </p>
      <h2>Clarity before everything.</h2>
      <p>
        Before each product arrives, you’ll be able to explore its ingredients,
        sizes, available options, price and delivery information. We’ll share
        product-specific information as our range is confirmed.
      </p>
      <Link className="button" to="/shop">
        Explore what’s next <Arrow />
      </Link>
    </div>
  );
}
const faqs = [
  [
    "When does the collection launch?",
    "We’re still preparing our first collection. We’ll share availability here when the products and delivery details are ready.",
  ],
  [
    "Can I order now?",
    "Orders are closed during our coming-soon phase. No demonstration or placeholder products are available to purchase.",
  ],
  ["Where will you deliver?", store.delivery],
  ["How will returns work?", store.returns],
  [
    "Where can I find ingredients and usage guidance?",
    "Every future product page will include its ingredient list, how-to-use information, available sizes and delivery details.",
  ],
  [
    "How do I contact you?",
    "Our customer contact details will be published before orders open.",
  ],
];
function FAQ() {
  return (
    <div className="page narrow">
      <p className="eyebrow">GOOD TO KNOW</p>
      <h1>A few little details.</h1>
      {faqs.map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
function Contact() {
  return (
    <div className="page narrow">
      <p className="eyebrow">LET’S TALK</p>
      <h1>A little connection.</h1>
      <p className="intro">We’re preparing our customer support channels.</p>
      {store.contactEmail ? (
        <a className="text-link" href={`mailto:${store.contactEmail}`}>
          {store.contactEmail}
        </a>
      ) : (
        <p>Our contact details will be published here before orders open.</p>
      )}
      <Link className="text-link" to="/faq">
        Read our frequently asked questions <Arrow />
      </Link>
    </div>
  );
}
const policyContent: Record<string, [string, string[]]> = {
  delivery: [
    "Delivery",
    [
      "Our delivery details are being prepared.",
      store.delivery,
      "Some future products may be dispatched by fulfilment partners. Product-specific dispatch and delivery estimates will be shown before purchase.",
    ],
  ],
  returns: [
    "Returns",
    [
      store.returns,
      "Before launch, this page will describe how to request a return, the return address, applicable costs, and how damaged or incorrect items are handled.",
    ],
  ],
  privacy: [
    "Privacy",
    [
      "This policy is being prepared before launch.",
      "Customer identities use the same authentication service as our related store. This storefront restricts order access to the signed-in customer and this store.",
      "Before orders open, we will publish the business identity, privacy contact, retention periods, processors, customer rights and consent information.",
    ],
  ],
  terms: [
    "Terms",
    [
      "Terms of sale are being prepared.",
      "Before purchases open, this page will include the seller’s legal details, payment terms, fulfilment responsibilities and support process.",
    ],
  ],
};
function Policy() {
  const { kind } = useParams();
  const content = policyContent[kind || ""];
  return (
    <div className="page narrow">
      <p className="eyebrow">STORE INFORMATION · IN PREPARATION</p>
      <h1>{content?.[0] || "Page not found"}.</h1>
      {content?.[1].map((text) => (
        <p key={text}>{text}</p>
      ))}
      <p>Purchases remain closed while these details are being finalised.</p>
    </div>
  );
}
const productTemplate = {
  id: "<product-uuid>",
  slug: "<product-slug>",
  title: "<product-name>",
  description: "<description>",
  collection: "cleanse",
  ingredients: "<supplier-confirmed-ingredient-list>",
  usage: "<supplier-confirmed-directions>",
  delivery: "<confirmed-product-delivery-details>",
  images: [
    {
      url: "https://<image-host>/<store-id>/products/<product-id>/front.webp",
      alt: "<accurate-image-description>",
    },
  ],
  published: false,
  demo: false,
  variants: [
    {
      id: "<variant-uuid>",
      label: "<variant-label>",
      sku: "<unique-sku>",
      size: "<size>",
      price_cents: 0,
      stock: 0,
    },
  ],
};
function Admin() {
  const [text, setText] = useState(JSON.stringify(productTemplate, null, 2));
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    try {
      const result = await api<{ products: Product[] }>("admin/products");
      setProducts(result.products);
      setMessage("Catalogue loaded.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not load.");
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const product = productSchema.parse(JSON.parse(text));
      await api("admin/products", product);
      setMessage("Product saved. Publish only confirmed real products.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Check the product data.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <p className="eyebrow">STORE ADMINISTRATION</p>
      <h1>Collection studio.</h1>
      <p>
        Selected store: {store.name} ({store.id}). Your account needs membership
        for this store.
      </p>
      <Link className="text-link" to="/account">
        Sign in →
      </Link>
      <button className="text-link" disabled={busy} onClick={() => void load()}>
        Load products
      </button>
      <div className="admin-grid">
        <div>
          <h2>Products</h2>
          {products.map((p) => (
            <button
              className="admin-product"
              key={p.id}
              onClick={() => setText(JSON.stringify(p, null, 2))}
            >
              {p.title} · {p.published ? "Published" : "Draft"}
            </button>
          ))}
          <p>
            Use UUIDs for product and variant IDs. Prices are integer ZAR cents.
            Images must use HTTPS and descriptive alt text.
          </p>
          <p>
            The site remains closed until the store’s launch settings and
            payment setup are complete.
          </p>
        </div>
        <form onSubmit={save}>
          <label htmlFor="product-json">Product data</label>
          <textarea
            id="product-json"
            rows={27}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          <button className="button" disabled={busy}>
            Save product <Arrow />
          </button>
        </form>
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <Link to="/" className="wordmark">
            {store.name.toLowerCase()}
            <span aria-hidden="true">✳</span>
          </Link>
          <p>{store.tagline}</p>
        </div>
        <div>
          <p className="eyebrow">EXPLORE</p>
          <Link to="/shop">The collection</Link>
          <Link to="/about">Our approach</Link>
          <Link to="/faq">Good to know</Link>
        </div>
        <div>
          <p className="eyebrow">HERE TO HELP</p>
          <Link to="/contact">Contact</Link>
          <Link to="/policies/delivery">Delivery</Link>
          <Link to="/policies/returns">Returns</Link>
        </div>
        <p className="footer-note">
          A considered approach
          <br />
          to everyday skincare.
          <br />
          <em>Coming soon.</em>
        </p>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {store.name}
        </span>
        <div>
          <Link to="/policies/privacy">Privacy</Link>
          <Link to="/policies/terms">Terms</Link>
        </div>
        <span>Take a moment. Make it yours.</span>
      </div>
    </footer>
  );
}
function Site({ initialCatalog }: { initialCatalog?: Catalog }) {
  const [catalog, setCatalog] = useState<Catalog>(initialCatalog || {
    products: [],
    checkoutEnabled: false,
    ready: false,
  });
  const location = useLocation();
  useEffect(() => {
    let alive = true;
    void api<Catalog>("catalog")
      .then((data) => {
        if (alive) setCatalog(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${location.pathname === "/" ? store.tagline : location.pathname.split("/").filter(Boolean).join(" · ")} · ${store.name}`;
    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${siteUrl()}${location.pathname}`;
    document.querySelector("main")?.focus({ preventScroll: true });
  }, [location.pathname]);
  return (
    <CatalogContext.Provider value={catalog}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/account" element={<Account />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/policies/:kind" element={<Policy />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <div className="page">
                <Empty
                  title="This page is taking a different path."
                  text="We couldn’t find that page. Return home to explore."
                />
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </CatalogContext.Provider>
  );
}
export default function App({ initialCatalog }: { initialCatalog?: Catalog }) {
  return (
    <CartProvider>
      <Site initialCatalog={initialCatalog} />
    </CartProvider>
  );
}
