import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { to, subject, pdfBase64, clientName, plate } = await req.json()

    // Utilise Resend pour envoyer l'email
    // Inscrivez-vous gratuitement sur https://resend.com pour obtenir votre clé API
    const RESEND_API_KEY = process.env.RESEND_API_KEY

    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API Resend manquante. Ajoutez RESEND_API_KEY dans vos variables d\'environnement Vercel.' },
        { status: 500 }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TruckCheck <noreply@votre-domaine.com>',
        to: [to],
        subject: subject || `État des lieux — ${plate} — ${clientName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
            <div style="background: #1a3a5c; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
              <h1 style="margin:0; font-size: 20px;">TruckCheck</h1>
              <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">État des lieux comparatif</p>
            </div>
            <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Bonjour <strong>${clientName}</strong>,</p>
              <p>Veuillez trouver en pièce jointe l'état des lieux comparatif du véhicule <strong>${plate}</strong>.</p>
              <p>Ce document récapitule l'état du véhicule au départ et au retour de la location.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
              <p style="font-size: 12px; color: #6b7280;">Document généré automatiquement par TruckCheck.</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `etat-des-lieux-${plate}-${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBase64,
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
