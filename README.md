This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


1) Création de la demande (pending)

Table : public.farmer_requests
Action : INSERT
RLS : WITH CHECK (user_id = auth.jwt()->>'sub')
Statut initial : pending
Unicité : 1 demande pending max par user_id + par email (index partiels)

2) Validation admin (approved / rejected)

Action admin : UPDATE farmer_requests SET status='approved'|'rejected'
RLS : is_admin() requis pour UPDATE/DELETE et SELECT global
Trigger : trg_farmer_requests_status_change (BEFORE UPDATE OF status)
Fonction : handle_farmer_request_status_change() (SECURITY DEFINER)

3) Approved

farmer_requests reçoit :
validated_by = admin_sub
approved_by_admin_at = now()
updated_at = now()
profiles :
UPSERT user_id=request.user_id
role='farmer'
email=request.email
listing :
création si inexistante
listing “draft” (active=false) pré-rempli (name/email/phone/location/lat/lng)
profiles.farm_id lié au listing

4) Rejected

farmer_requests reçoit :
validated_by = admin_sub
updated_at = now()
admin_reason optionnel
Aucun listing créé