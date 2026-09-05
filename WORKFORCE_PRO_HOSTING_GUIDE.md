# WorkForce Pro — Architecture, Hosting & Free-Tier Longevity Guide

---

## 1. Can It Be Downloaded as an Android App?

### **Yes! It is already configured as a Progressive Web App (PWA).**
You do **not** need to use it only inside a browser URL bar. It can be installed directly onto any Android phone or tablet.

#### **How to install on Android:**
1. Open Google Chrome on your Android phone.
2. Navigate to: `https://workforce-pro-beta.vercel.app`
3. Tap the **three dots menu (⋮)** in the top right corner.
4. Tap **"Install App"** (or **"Add to Home screen"**).
5. Tap **Install**.

#### **What happens after installation:**
- An app icon titled **WorkForce** appears on your home screen and in your Android app drawer.
- It opens as a **standalone, full-screen app** without any browser address bar, back/forward buttons, or navigation tabs.
- It feels and operates exactly like a native Android app from the Google Play Store.

#### **Optional: Converting to a Google Play Store APK / AAB**
If you ever want an official `.apk` installer file or want to publish on Google Play Store:
- Go to [PWABuilder.com](https://www.pwabuilder.com) (free tool developed by Microsoft).
- Enter `https://workforce-pro-beta.vercel.app`.
- Click **Build My PWA** -> **Android Package**.
- It will generate an APK / AAB package ready for installation or publishing, requiring **zero code changes**.

---

## 2. Where & How Is Your Data Stored?

### **Storage Location:**
All your workforce data is securely stored in a **Neon Serverless PostgreSQL Database** hosted in the cloud (AWS US-East region).

### **What Data Is Stored:**
- **Users**: Admin credentials and roles.
- **Workers**: Names, worker IDs, phone numbers, departments, joining dates, base salaries, statuses.
- **Attendance**: Daily check-ins, check-outs, status (Present, Absent, Leave, Half Day), daily salary calculated.
- **Leaves**: Leave requests, types (Sick, Personal), approvals, paid/unpaid status.
- **Salary History**: Monthly calculated pay, present days, deductions, total earnings.
- **Company Settings**: Work timings, salary divisors, holiday rules.

### **How It Works:**
- Whenever you or a supervisor mark attendance or add a worker, the Next.js API on Vercel sends the transaction to Neon PostgreSQL via **Prisma ORM**.
- The data is stored in redundant cloud disks with automatic failover.
- Data is **not stored locally on the phone** (except login session tokens). If your phone is lost or damaged, your data is 100% safe in the database.

---

## 3. Storage Capacity & Free Tier Limits

Both **Vercel** and **Neon** offer extremely generous lifetime free tiers.

### **A. Neon PostgreSQL Free Tier Limits**
| Resource | Free Tier Limit | Real-World Capacity for WorkForce Pro |
|---|---|---|
| **Database Storage** | **0.5 GiB (500 MB)** | Over **1,000,000+ attendance records** |
| **Active Compute Time** | **100 hours / month** | Ample for daily operations |
| **Cost** | **$0 / month forever** | No credit card required |

#### How long will 500 MB last?
- A typical attendance row takes ~**250 bytes**.
- For a company with **50 workers**:
  - Daily records = 50 rows (~12.5 KB/day)
  - Monthly records = ~375 KB/month
  - Yearly records = ~4.5 MB/year
- **500 MB will last you roughly 50 to 100 years of daily usage** before reaching the storage limit.

#### What about Compute Hours (100 hrs/month)?
- Neon uses **Auto-Suspend**. When nobody is using the app, the database compute automatically sleeps (0 hours consumed).
- It only wakes up for the few seconds when an API request (like marking attendance or loading a report) arrives.
- Daily usage will typically consume less than 15-30 compute hours per month, well within the 100 hours limit.

---

### **B. Vercel Free Tier (Hobby Plan) Limits**
| Resource | Free Tier Limit | WorkForce Pro Real-World Usage |
|---|---|---|
| **Bandwidth** | **100 GB / month** | Usually < 1 GB / month |
| **Serverless Function Execution** | **100 GB-hours / month** | Usually < 2 GB-hours / month |
| **Deployments** | **Unlimited** | As many code updates as needed |
| **SSL Certificate (HTTPS)** | **Free & Automatic** | Renews automatically forever |
| **Custom Domain Support** | **Free** | You can connect your own `.com` anytime |

---

## 4. Best Practices & Measures to Keep It 100% Free for Lifetime

To ensure you never get billed and never hit limits, follow these simple rules:

### 1. **Do Not Store Large Photos Directly in the Database**
- In `schema.prisma`, `profilePhoto` is stored as a URL string.
- If you upload worker profile pictures, keep them under 200KB or use free image hosting (e.g., Cloudinary free tier, ImgBB, or Uploadthing free tier).
- Never save full-resolution 10MB camera photos directly as raw Base64 text in the database.

### 2. **Keep the Connection Pooler URL**
- Ensure your `DATABASE_URL` uses the connection pooler endpoint (contains `-pooler` in the hostname).
- This prevents connection exhaustion when multiple requests happen at once.

### 3. **Export Periodic Backups**
- Use the app's built-in **Export to Excel / CSV** feature periodically (e.g., at the end of each month) to keep local archives of your salary and attendance sheets.
- You can also take free snapshots directly inside the Neon dashboard under the **Branches** or **Backups** tab.

### 4. **Keep `NEXTAUTH_URL` Synced**
- Whenever you change domains or aliases, ensure `NEXTAUTH_URL` in Vercel environment variables points to your active production domain (`https://workforce-pro-beta.vercel.app`).
