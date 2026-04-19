
User regenerated the Razorpay Key Secret and wants me to update `RAZORPAY_KEY_SECRET` in Lovable Cloud. They haven't pasted the new value yet — I need it before I can update.

## Plan

1. Ask user to paste the new Key Secret from Razorpay Dashboard (Settings → API Keys → after Regenerate).
2. Once provided, update the `RAZORPAY_KEY_SECRET` runtime secret in Lovable Cloud (the other 3 Razorpay secrets stay unchanged).
3. No code changes — edge functions read the secret dynamically.

## What I need from you

Paste the **new Key Secret** (the long string shown once after clicking Regenerate in Razorpay). The Key ID stays the same (`rzp_live_SfN5j8dYf6Eeoa`) unless you also regenerated that.

## Security note
Send it in the next message; once updated, treat that chat message as sensitive. Razorpay only shows the secret once — make sure you've copied it before closing the dialog.
