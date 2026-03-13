# 📄 InvoicePro — GST Invoice Manager
### Developer & Deployment Guide (Firebase Edition 🔥)

> Built by Adithya M · Single-file HTML app · No backend required  
> Stack: React 18 · jsPDF · SheetJS · Firebase Realtime Database

---

## 📁 Files in This Repository

```
invoice_manager/
├── index.html     ← The ENTIRE app (only file that matters)
└── README.md      ← This guide
```

---

## ✅ Why Firebase Instead of Supabase

| Feature | Supabase Free | Firebase Free |
|---------|--------------|---------------|
| Pauses when inactive | ❌ After 7 days | ✅ Never |
| Free projects per account | 2 | **10** |
| All customers in 1 dashboard | ❌ Separate logins | ✅ One console |
| Free forever | ⚠️ May change | ✅ Permanent |
| Storage | 500 MB | 1 GB |

**Firebase = one Google login, all customers visible, never pauses.**

---
---

# 🔥 PART 1 — SETTING UP FIREBASE
### (Learn once — takes 5 minutes per customer after that)

---

### STEP 1 — Open Firebase Console

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Sign in with **your own Google account**
   - You manage ALL customers from this one account
   - No need to create separate Gmail per customer

---

### STEP 2 — Create a New Project

1. Click **"+ Add project"**
2. **Project name**: Use customer's business name (no spaces, use hyphens)
   - Good: `sharma-traders-invoice`
   - Good: `abc-pvt-ltd-gst`
3. Click **Continue**
4. **Google Analytics** → Turn **OFF**
5. Click **"Create project"** → wait ~30 seconds
6. Click **Continue** when ready

---

### STEP 3 — Enable Realtime Database

> ⚠️ This step is critical — do not skip

1. Left sidebar → click **"Build"** → click **"Realtime Database"**
2. Click **"Create database"**
3. **Location**: Choose **"asia-southeast1 (Singapore)"**
   - This is the closest server to India — fastest speed
4. **Security rules**: Choose **"Start in test mode"**
5. Click **"Enable"**

Database is ready ✅ — you will see an empty database screen.

---

### STEP 4 — Register a Web App & Get Config Values

1. Click the **⚙️ gear icon** → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **`</>`** (Web) icon
4. **App nickname**: type `InvoicePro`
5. Leave "Firebase Hosting" **unchecked**
6. Click **"Register app"**
7. You will now see a block of code like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "sharma-traders-invoice.firebaseapp.com",
  databaseURL: "https://sharma-traders-invoice-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sharma-traders-invoice",
  storageBucket: "sharma-traders-invoice.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

8. **Copy all 7 values and save in Notepad** — you will paste these into the HTML

> 💾 Tip: Keep a spreadsheet — one row per customer — with their project name and all 7 config values saved.

---

### STEP 5 — Edit the HTML File (6 Things to Change)

Open `index.html` in **VS Code** or **Notepad++**

---

#### 🔴 CHANGE 1 — Firebase Config (7 values)
Press **Ctrl+F** → search `PASTE_PROJECT_ID` → find this block (line ~337):

```javascript
// BEFORE (placeholder):
const FIREBASE_CONFIG = {
  apiKey:            "PASTE_API_KEY_HERE",
  authDomain:        "PASTE_PROJECT_ID.firebaseapp.com",
  databaseURL:       "https://PASTE_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "PASTE_PROJECT_ID",
  storageBucket:     "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId:             "PASTE_APP_ID"
};

// AFTER (filled in):
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyXXXXXXXXXXXXXXXXXXXXX",
  authDomain:        "sharma-traders-invoice.firebaseapp.com",
  databaseURL:       "https://sharma-traders-invoice-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "sharma-traders-invoice",
  storageBucket:     "sharma-traders-invoice.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456789012:web:abcdef123456"
};
```

---

#### 🔴 CHANGE 2 — Super Admin Emails
Search `SUPER_ADMINS` (line ~360):

```javascript
// BEFORE:
const SUPER_ADMINS = ['adithya@business.com', 'invoice@business.com'];

// AFTER:
const SUPER_ADMINS = ['owner@sharmatraders.com', 'manager@sharmatraders.com'];
```

> ⚠️ These must be lowercase. These are the emails that get Super Admin power.

---

#### 🔴 CHANGE 3 & 4 — Super Admin Login Credentials
Search `SA1` (line ~455):

```javascript
// BEFORE:
{ id:'SA1', email:'Adithya@business.com', name:'Adithya M',     password:'Business@2026', role:'superadmin', active:true },
{ id:'SA2', email:'Invoice@business.com', name:'Invoice Admin', password:'Business@2026', role:'superadmin', active:true },

// AFTER:
{ id:'SA1', email:'Owner@sharmatraders.com',   name:'Sharma Owner',   password:'Sharma@2025', role:'superadmin', active:true },
{ id:'SA2', email:'Manager@sharmatraders.com', name:'Sharma Manager', password:'Sharma@2025', role:'superadmin', active:true },
```

---

#### 🔴 CHANGE 5 & 6 — Support Contact on Login Page
Search `contact@business.com` (line ~2195):

```
contact@business.com   →   owner@sharmatraders.com
+91 8800112233         →   +91 9XXXXXXXXXX
```

---

### STEP 6 — Upload to GitHub and Go Live

1. Go to **github.com** → Create a new **public** repository
   - Name: `invoice` or `invoicepro` or `gst-invoices`
2. Upload `index.html` and `README.md`
3. Go to repo **Settings → Pages**
4. Source: **Deploy from branch** → `main` → `/ (root)` → **Save**
5. Wait 2 minutes → your URL:  `https://USERNAME.github.io/REPONAME/`

Done! 🎉 Share this URL + login credentials with the customer.

---
---

# 👥 PART 2 — CUSTOMER DATABASE (inside the app)

The Customer Database stores Bill To details so invoices auto-fill with one click.

---

### How to Add a Customer

**Method 1 — While creating an invoice (fastest)**
1. Fill in the Bill To section completely
2. Click **"Save Customer"** button
3. That customer is now saved for all future invoices

**Method 2 — From Customer Database directly**
1. Click **"Customers"** in the top navigation
2. Click **"+ Add Customer"**
3. Fill in details → Save

---

### How Autocomplete Works

When filling Customer Name in an invoice:
- Type **2+ letters** → a dropdown appears
- Shows matching customers with their GSTIN and city
- Click one → **all fields auto-fill** (address, GSTIN, phone, email)

---

### How to Edit / Delete a Customer

1. Click **"Customers"** in top nav
2. Find the customer → click ✏️ Edit or 🗑️ Delete
3. Deleting a customer does **NOT** delete their invoices

---

### Customer Fields

| Field | Notes |
|-------|-------|
| Name ✅ | Required — used for search |
| Address | Street, area |
| City | |
| State | Auto-detected from GSTIN |
| PIN | 6-digit pincode |
| GSTIN | Auto-validates the format |
| Phone | |
| Email | |

---
---

# 📋 PART 3 — FULL DEPLOYMENT CHECKLIST

Copy this into Notepad for each new customer deployment:

```
CUSTOMER NAME: _______________________
DEPLOYMENT DATE: ______________________

[ ] FIREBASE SETUP
    [ ] Opened console.firebase.google.com
    [ ] Created new project: ___________________
    [ ] Enabled Realtime Database (asia-southeast1, test mode)
    [ ] Registered Web App — got firebaseConfig
    [ ] Saved all 7 config values in my spreadsheet

[ ] CODE CHANGES IN index.html
    [ ] FIREBASE_CONFIG — all 7 values replaced (line ~337)
    [ ] SUPER_ADMINS emails changed (line ~360)
    [ ] SA1 — email, name, password changed (line ~455)
    [ ] SA2 — email, name, password changed (line ~456)
    [ ] Login page support email changed (line ~2195)
    [ ] Login page support phone changed (line ~2198)

[ ] DEPLOYED
    [ ] Uploaded to GitHub repository
    [ ] GitHub Pages enabled
    [ ] Live URL: _____________________________

[ ] TESTED
    [ ] Loaded the live URL — saw loading screen
    [ ] Logged in with new Super Admin credentials
    [ ] Created 1 test invoice → saved
    [ ] Refreshed page → invoice still there ✅ (Firebase sync confirmed)
    [ ] Deleted test invoice

[ ] HANDED OVER
    [ ] Sent live URL to customer
    [ ] Sent login credentials to customer
    [ ] Customer logged in successfully
```

---
---

# ⚙️ PART 4 — COMMON TASKS AFTER DEPLOYMENT

---

### Add a New App User for the Customer

1. Login as Super Admin or Admin
2. Click **Admin Panel** → **Users** tab
3. Fill in: Name, Email, Password, Role → **Create User**

**Role guide:**
| Role | What They Can Do |
|------|-----------------|
| User | Create invoices, expenses |
| Admin | All + reports + manage users |
| Super Admin | All + delete users + audit log |

---

### Change a User's Password

Admin Panel → Users → **Edit** → change password → **Update User**

---

### View All Customer Data in Firebase

1. Firebase Console → your project → **Realtime Database**
2. Open the `invoicepro` node
3. All data is here:

```
invoicepro/
  ip_inv          → All invoices
  ip_co           → Company details (name, GSTIN, logo, bank)
  ip_users        → All app users and passwords
  ip_customers    → Customer database
  ip_expenses     → All expenses / purchases
  ip_hsn          → HSN code database
  ip_audit        → Last 30 days of activity logs
  ip_ctr_INV_2025 → Invoice number counter
```

---

### Reset Invoice Counter

Want next invoice to be INV-2025-0050 instead of 0001?

1. Firebase Console → Realtime Database
2. Find: `invoicepro/ip_ctr_INV_2025`
3. Click the value → Edit → type `50` → press Enter
4. Next invoice will be INV-2025-0050 ✅

---

### Download Full Data Backup

1. Firebase Console → Realtime Database
2. Click the **⋮ (3 dots)** next to `invoicepro`
3. Click **"Export JSON"**
4. Saves entire database as a `.json` file

---

### What Happens If Internet is Down

The app has a **localStorage fallback**:
- If Firebase is unreachable → app loads from browser memory
- All features still work
- Changes saved locally
- When internet is back → Firebase syncs on next app open

---
---

# 🔒 PART 5 — MAKING IT PRIVATE (Optional)

### Keep GitHub Repo Private

Since `index.html` contains Firebase keys, it is safer to make the repo private:

1. GitHub repo → **Settings** → scroll to **"Danger Zone"**
2. **"Change visibility"** → **Private**

> GitHub Pages still works with private repos. URL still accessible to anyone with the link.

### Firebase Security Rules (After 30 Days)

Firebase will warn you that test mode expires. To extend it permanently:

1. Firebase Console → Realtime Database → **Rules** tab
2. Replace with:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. Click **Publish**

This is fine because the app has its own user login system.

---
---

# 📊 PART 6 — MY CUSTOMER TRACKER
### (Fill this in for every customer you deploy for)

| # | Customer Name | Firebase Project ID | Live URL | Super Admin Email | Deployed On |
|---|--------------|--------------------|---------|--------------------|-------------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |
| 7 | | | | | |
| 8 | | | | | |
| 9 | | | | | |
| 10 | | | | | |

> 💡 Copy this table into a private Google Sheet for easier management

---

# 🔄 VERSION HISTORY

| Version | Changes |
|---------|---------|
| v1–v5 | Invoice, PDF, GST, Excel, Supabase cloud |
| v6 | Credit/Debit notes, mobile responsive, dark mode, original invoice reference |
| **v7** | **Firebase migration** — never pauses, 10 free projects, one dashboard |

---

# 📞 DEVELOPER CONTACT

- **Developer**: Adithya M
- **Email**: adithya@business.com
- **Phone**: +91 8800112233
- **GitHub**: [naturalorg](https://github.com/naturalorg)

---

*InvoicePro · GST Invoice Manager · Made for Indian small businesses 🇮🇳*
