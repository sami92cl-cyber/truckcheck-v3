'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// Nouvelles interfaces pour gérer Départ et Retour
interface SectionData { 
  name: string; 
  photoDepart: string; 
  photoRetour: string; 
  damageDepart: string; 
  damageRetour: string; 
  noteDepart: string; 
  noteRetour: string 
}

interface DepartRetour {
  sections: SectionData[];
  agentSig: string;
  clientSig: string;
  dateLabel: string;
  km: string;
  carburantLevel: string;
}

interface Dossier {
  id: string;
  contractNum: string;
  plate: string;
  clientName: string;
  type: string;
  society: string;
  agence: string;
  lieu: string;
  agentName: string;
  agentEmail: string;
  clientEmail: string;
  clientPhone: string;
  clientPermis: string;
  marque: string;
  modele: string;
  carburantType: string;
  depart: DepartRetour;
  retour?: DepartRetour; // Optionnel car créé après
}

// Options identiques
const DAMAGE_OPTIONS = ['Rien à signaler','Rayure légère','Rayure profonde','Bosse','Fissure','Bris de vitre','Pneu endommagé','Autre']
const FUEL_OPTIONS = ['Vide','1/8','1/4','3/8','1/2','5/8','3/4','Plein']
const SECTIONS = ['Compteur','Face avant générale','Roue avant gauche','Latéral gauche avant','Latéral gauche arrière','Roue arrière gauche','Face arrière générale','Intérieur arrière','Roue arrière droite','Latéral droit arrière','Latéral droit avant','Roue avant droite','Photo libre 1','Photo libre 2','Photo libre 3']

// Fonction pour créer une section vide
const emptySection = (name: string): SectionData => ({ 
  name, 
  photoDepart: '', 
  photoRetour: '', 
  damageDepart: 'Rien à signaler', 
  damageRetour: 'Rien à signaler', 
  noteDepart: '', 
  noteRetour: '' 
})

// Fonction pour créer un objet DepartRetour vide
const emptyDepartRetour = (): DepartRetour => ({
  sections: SECTIONS.map(emptySection),
  agentSig: '',
  clientSig: '',
  dateLabel: '',
  km: '',
  carburantLevel: 'Plein'
})

// Fonction pour générer un PDF amélioré
function generatePDF(d: any) {
  const win = window.open('', '_blank')
  if (!win) { alert('Autorisez les popups pour le PDF.'); return }
  
  const now = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
  
  // Fonction pour générer le HTML des photos avec comparaison
  // sDepart = section du départ, sRetour = section correspondante du retour (si existe)
  const photoHtml = (sDepart: SectionData, sRetour?: SectionData) => {
    let html = '<div style="display:flex;gap:10px;margin-bottom:10px;">'
    
    // Photo Départ
    html += '<div style="flex:1;">'
    html += '<div style="font-size:11px;font-weight:600;color:#4a5b7a;margin-bottom:4px;">DÉPART</div>'
    if (sDepart.photoDepart) {
      html += `<img src="${sDepart.photoDepart}" style="width:100%;max-height:140px;object-fit:cover;border-radius:6px;border:2px solid #4a90d9;">`
    } else {
      html += `<div style="height:80px;background:#f4f7fb;border:1.5px dashed #b8c8dc;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#8a9ab5;font-size:12px;">Pas de photo</div>`
    }
    if (sDepart.damageDepart !== 'Rien à signaler') {
      html += `<div style="margin-top:4px;display:inline-block;background:#fff0f0;color:#c0392b;border-radius:20px;padding:2px 8px;font-size:10px;font-weight:600;">⚠ ${sDepart.damageDepart}</div>`
    }
    html += '</div>'
    
    // Photo Retour (si existe) — utilise la section retour correspondante
    if (d.retour && sRetour) {
      html += '<div style="flex:1;">'
      html += '<div style="font-size:11px;font-weight:600;color:#e74c3c;margin-bottom:4px;">RETOUR</div>'
      if (sRetour.photoRetour) {
        html += `<img src="${sRetour.photoRetour}" style="width:100%;max-height:140px;object-fit:cover;border-radius:6px;border:2px solid #e74c3c;">`
      } else {
        html += `<div style="height:80px;background:#f4f7fb;border:1.5px dashed #b8c8dc;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#8a9ab5;font-size:12px;">Pas de photo</div>`
      }
      if (sRetour.damageRetour !== 'Rien à signaler') {
        html += `<div style="margin-top:4px;display:inline-block;background:#fff0f0;color:#c0392b;border-radius:20px;padding:2px 8px;font-size:10px;font-weight:600;">⚠ ${sRetour.damageRetour}</div>`
      }
      html += '</div>'
    }
    
    html += '</div>'
    
    // Notes
    if (sDepart.noteDepart || (sRetour && sRetour.noteRetour)) {
      html += '<div style="margin-top:6px;font-size:11px;">'
      if (sDepart.noteDepart) html += `<div><strong>Départ:</strong> ${sDepart.noteDepart}</div>`
      if (sRetour && sRetour.noteRetour) html += `<div><strong>Retour:</strong> ${sRetour.noteRetour}</div>`
      html += '</div>'
    }
    
    return html
  }
  
  const sigHtml = (sig: string) => sig ? `<img src="${sig}" style="width:100%;height:70px;object-fit:contain;border:1px solid #e4e6eb;border-radius:6px;">` : `<div style="height:70px;border:1px solid #e4e6eb;border-radius:6px;display:flex;align-items:flex-end;padding:6px;color:#c0c8d4;font-size:11px;">Signature</div>`
  
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>État des lieux ${d.plate||''}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,sans-serif;background:#f0f2f5;color:#1a1f36;}
    .page{max-width:900px;margin:0 auto;padding:20px;}
    .hdr{background:#1a1f36;color:white;border-radius:12px;padding:18px 22px;margin-bottom:18px;display:flex;align-items:center;gap:14px;}
    .logo{background:#f5c518;border-radius:10px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#1a1f36;}
    .card{background:white;border-radius:12px;border:1px solid #e4e6eb;padding:16px;margin-bottom:14px;}
    .ct{font-weight:800;font-size:15px;margin-bottom:12px;}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .lbl{font-size:11px;color:#8a94a6;font-weight:600;margin-bottom:2px;}
    .val{font-size:13px;font-weight:600;}
    .sg{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .si{break-inside:avoid;margin-bottom:14px;background:white;border:1px solid #e4e6eb;border-radius:8px;padding:12px;}
    .sn{font-weight:700;font-size:13px;margin-bottom:8px;}
    @media print{body{background:white;}@page{margin:1.2cm;}}
  </style>
</head>
<body>
  <div class="page">
    <div class="hdr">
      <div class="logo">FLYCAR</div>
      <div>
        <div style="font-size:18px;font-weight:900;">État des lieux</div>
        <div style="font-size:12px;opacity:0.7;">Généré le ${now}</div>
      </div>
      <div style="margin-left:auto;text-align:right;">
        <div style="font-size:20px;font-weight:900;font-family:monospace;">${d.plate||'—'}</div>
        <div style="font-size:11px;opacity:0.7;">${d.contractNum||'—'}</div>
      </div>
    </div>
    
    <div class="card">
      <div class="ct">Informations générales</div>
      <div class="g2">
        <div><div class="lbl">Société</div><div class="val">${d.society||'—'}</div></div>
        <div><div class="lbl">Contrat</div><div class="val">${d.contractNum||'—'}</div></div>
        <div><div class="lbl">Agence</div><div class="val">${d.agence||'—'}</div></div>
        <div><div class="lbl">Lieu</div><div class="val">${d.lieu||'—'}</div></div>
        <div><div class="lbl">Agent</div><div class="val">${d.agentName||'—'}</div></div>
        <div><div class="lbl">Email</div><div class="val">${d.agentEmail||'—'}</div></div>
      </div>
    </div>
    
    <div class="card">
      <div class="ct">Locataire</div>
      <div class="g2">
        <div><div class="lbl">Nom</div><div class="val">${d.clientName||'—'}</div></div>
        <div><div class="lbl">Email</div><div class="val">${d.clientEmail||'—'}</div></div>
        <div><div class="lbl">Téléphone</div><div class="val">${d.clientPhone||'—'}</div></div>
        <div><div class="lbl">Permis</div><div class="val">${d.clientPermis||'—'}</div></div>
      </div>
    </div>
    
    <div class="card">
      <div class="ct">Véhicule</div>
      <div class="g2">
        <div><div class="lbl">Immatriculation</div><div class="val" style="font-size:16px;font-family:monospace;">${d.plate||'—'}</div></div>
        <div><div class="lbl">Marque / Modèle</div><div class="val">${d.marque||'—'} ${d.modele||''}</div></div>
        <div><div class="lbl">Carburant</div><div class="val">${d.carburantType||'—'}</div></div>
      </div>
    </div>
    
    ${d.retour ? `
    <div class="card">
      <div class="ct">Comparaison Départ / Retour</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px;">
        <div style="padding:12px;background:#f8f9fb;border-radius:8px;">
          <div style="font-weight:700;color:#4a90d9;margin-bottom:8px;">DÉPART (${d.depart.dateLabel})</div>
          <div><span class="lbl">Kilométrage:</span> <span class="val">${d.depart.km?Number(d.depart.km).toLocaleString('fr-FR')+' km':'—'}</span></div>
          <div><span class="lbl">Carburant:</span> <span class="val">${d.depart.carburantLevel||'—'}</span></div>
        </div>
        <div style="padding:12px;background:#f8f9fb;border-radius:8px;">
          <div style="font-weight:700;color:#e74c3c;margin-bottom:8px;">RETOUR (${d.retour.dateLabel})</div>
          <div><span class="lbl">Kilométrage:</span> <span class="val">${d.retour.km?Number(d.retour.km).toLocaleString('fr-FR')+' km':'—'}</span></div>
          <div><span class="lbl">Carburant:</span> <span class="val">${d.retour.carburantLevel||'—'}</span></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:${d.retour ? '1fr' : '1fr 1fr'};gap:14px;">
        ${d.depart.sections.map((s: SectionData, i: number) => {
          const sRetour = d.retour ? d.retour.sections[i] : undefined
          const hasContent = s.photoDepart || s.damageDepart !== 'Rien à signaler' || s.noteDepart || (sRetour && (sRetour.photoRetour || sRetour.damageRetour !== 'Rien à signaler' || sRetour.noteRetour))
          if (!hasContent) return ''
          return `
          <div class="si">
            <div class="sn">${s.name}</div>
            ${photoHtml(s, sRetour)}
          </div>`
        }).join('')}
      </div>
    </div>
    ` : `
    <div class="card">
      <div class="ct">Photos du départ</div>
      <div class="sg">
        ${d.depart.sections.filter((s: SectionData) => s.photoDepart || s.damageDepart !== 'Rien à signaler' || s.noteDepart).map((s: SectionData) => `
          <div class="si">
            <div class="sn">${s.name}</div>
            ${s.photoDepart ? `<img src="${s.photoDepart}" style="width:100%;border-radius:8px;margin-bottom:8px;max-height:160px;object-fit:cover;display:block;">` : ''}
            ${s.damageDepart !== 'Rien à signaler' 
              ? `<div style="display:inline-block;background:#fff0f0;color:#c0392b;border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600;">⚠ ${s.damageDepart}</div>`
              : `<div style="display:inline-block;background:#f0fff4;color:#27ae60;border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600;">✓ RAS</div>`
            }
            ${s.noteDepart ? `<p style="font-size:13px;color:#4a5568;margin-top:6px;font-style:italic;">${s.noteDepart}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    `}
    
    <div class="card">
      <div class="ct">Signatures</div>
      <div class="g2">
        <div>
          <div class="lbl" style="margin-bottom:6px;">Agent (Départ)</div>
          ${sigHtml(d.depart.agentSig)}
        </div>
        <div>
          <div class="lbl" style="margin-bottom:6px;">Locataire (Départ)</div>
          ${sigHtml(d.depart.clientSig)}
        </div>
        ${d.retour ? `
        <div>
          <div class="lbl" style="margin-bottom:6px;">Agent (Retour)</div>
          ${sigHtml(d.retour.agentSig)}
        </div>
        <div>
          <div class="lbl" style="margin-bottom:6px;">Locataire (Retour)</div>
          ${sigHtml(d.retour.clientSig)}
        </div>
        ` : ''}
      </div>
    </div>
  </div>
  <script>
    window.onload = () => window.print()
  <\/script>
</body>
</html>`)
  win.document.close()
}

// Fonction pour envoyer par email
function sendByEmail(dossier: Dossier) {
  const subject = `État des lieux - ${dossier.plate} - ${dossier.contractNum}`
  const body = `Bonjour,\n\nVeuillez trouver ci-joint l'état des lieux pour le véhicule ${dossier.plate} (Contrat: ${dossier.contractNum}).\n\nCordialement,\n${dossier.agentName}`
  
  // Ouvrir le client mail par défaut
  const mailtoLink = `mailto:${dossier.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoLink)
}

export default function TruckCheckApp() {
  const [view, setView] = useState<'home'|'form'|'detail'|'retour'>('home')
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [selected, setSelected] = useState<Dossier|null>(null)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({
    society: 'FLYCAR',
    contractNum: '',
    agence: '',
    lieu: '',
    agentName: '',
    agentEmail: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientPermis: '',
    plate: '',
    marque: '',
    modele: '',
    carburantType: 'Diesel',
    // Données pour le départ (formulaire initial)
    depart: emptyDepartRetour(),
    // Données pour le retour (formulaire de retour)
    retour: emptyDepartRetour()
  })

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }
  
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  
  const updateDepart = (field: string, value: any) => {
    setForm(f => ({
      ...f,
      depart: { ...f.depart, [field]: value }
    }))
  }
  
  const updateRetour = (field: string, value: any) => {
    setForm(f => ({
      ...f,
      retour: { ...f.retour, [field]: value }
    }))
  }
  
  const updateDepartSection = (i: number, k: keyof SectionData, v: string) => {
    setForm(f => ({
      ...f,
      depart: {
        ...f.depart,
        sections: f.depart.sections.map((s, idx) => idx === i ? { ...s, [k]: v } : s)
      }
    }))
  }
  
  const updateRetourSection = (i: number, k: keyof SectionData, v: string) => {
    setForm(f => ({
      ...f,
      retour: {
        ...f.retour,
        sections: f.retour.sections.map((s, idx) => idx === i ? { ...s, [k]: v } : s)
      }
    }))
  }

  // Sauvegarder le départ
  const handleSaveDepart = () => {
    if (!form.plate && !form.contractNum) { showToast('Ajoutez l\'immatriculation ou le contrat.'); return }
    
    const now = new Date()
    const dateLabel = now.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) + ' à ' + now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
    
    const d: Dossier = {
      id: Date.now().toString(),
      contractNum: form.contractNum || '—',
      plate: form.plate || '—',
      clientName: form.clientName || '—',
      type: 'Initiale',
      society: form.society,
      agence: form.agence,
      lieu: form.lieu,
      agentName: form.agentName,
      agentEmail: form.agentEmail,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone,
      clientPermis: form.clientPermis,
      marque: form.marque,
      modele: form.modele,
      carburantType: form.carburantType,
      depart: {
        ...form.depart,
        dateLabel
      }
    }
    
    setDossiers(p => [d, ...p])
    setForm({
      society: 'FLYCAR',
      contractNum: '',
      agence: '',
      lieu: '',
      agentName: '',
      agentEmail: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientPermis: '',
      plate: '',
      marque: '',
      modele: '',
      carburantType: 'Diesel',
      depart: emptyDepartRetour(),
      retour: emptyDepartRetour()
    })
    setView('home')
    showToast('Dossier départ enregistré !')
  }

  // Sauvegarder le retour
  const handleSaveRetour = () => {
    if (!selected) return
    
    const now = new Date()
    const dateLabel = now.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) + ' à ' + now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
    
    const updatedDossier: Dossier = {
      ...selected,
      retour: {
        ...form.retour,
        dateLabel
      }
    }
    
    setDossiers(p => p.map(d => d.id === selected.id ? updatedDossier : d))
    setSelected(updatedDossier)
    setView('detail')
    showToast('Retour enregistré !')
  }

  const nowStr = new Date().toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})

  const C: React.CSSProperties = { background:'white', borderRadius:24, border:'1px solid #e8eaed', padding:20 }
  const I: React.CSSProperties = { width:'100%', border:'1px solid #e4e6eb', borderRadius:12, padding:'10px 14px', fontSize:14, color:'#1a1f36', background:'white', outline:'none', boxSizing:'border-box' }

  // Composant Select
  const SelComp = ({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) => (
    <div style={{ position:'relative' }}>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:'100%', border:'1px solid #e4e6eb', borderRadius:12, padding:'10px 36px 10px 14px', fontSize:14, color:'#1a1f36', background:'white', outline:'none', appearance:'none', boxSizing:'border-box', cursor:'pointer' }}>
        {children}
      </select>
      <svg style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="8" viewBox="0 0 14 8" fill="none">
        <path d="M1 1l6 6 6-6" stroke="#8a94a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )

  // Composant Photo avec Canvas de dessin et horodatage
  const PhotoUpWithCanvas = ({ 
    value, 
    onChange, 
    showTimestamp = true 
  }: { 
    value: string; 
    onChange: (v: string) => void;
    showTimestamp?: boolean;
  }) => {
    const ref = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [showCanvas, setShowCanvas] = useState(false)
    const [canvasData, setCanvasData] = useState<string>('')
    
    // Fonction pour ajouter un horodatage sur l'image
    const addTimestampToImage = (imageDataUrl: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')!
          
          // Dessiner l'image
          ctx.drawImage(img, 0, 0)
          
          // Ajouter l'horodatage
          if (showTimestamp) {
            const now = new Date()
            const timestamp = now.toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(10, img.height - 40, 200, 30)
            ctx.font = '14px Arial'
            ctx.fillStyle = 'white'
            ctx.fillText(timestamp, 20, img.height - 20)
          }
          
          resolve(canvas.toDataURL('image/jpeg'))
        }
        img.src = imageDataUrl
      })
    }
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (!f) return
      
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string
        const withTimestamp = await addTimestampToImage(dataUrl)
        onChange(withTimestamp)
      }
      reader.readAsDataURL(f)
      e.target.value = ''
    }
    
    // Fonctions de dessin sur canvas
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      setIsDrawing(true)
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(x * (canvas.width / rect.width), y * (canvas.height / rect.height))
      }
    }
    
    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return
      e.preventDefault()
      
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineTo(x * (canvas.width / rect.width), y * (canvas.height / rect.height))
        ctx.strokeStyle = '#e74c3c'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.stroke()
      }
    }
    
    const stopDrawing = () => {
      setIsDrawing(false)
      const canvas = canvasRef.current
      if (canvas) {
        setCanvasData(canvas.toDataURL())
      }
    }
    
    const clearCanvas = () => {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          // Redessiner l'image de fond si elle existe
          if (value) {
            const img = new Image()
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            }
            img.src = value
          }
        }
      }
    }
    
    const applyDrawing = () => {
      if (canvasData && value) {
        // Fusionner le dessin avec l'image originale
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          
          // Ajouter le dessin du canvas
          const drawImg = new Image()
          drawImg.onload = () => {
            ctx.drawImage(drawImg, 0, 0, canvas.width, canvas.height)
            onChange(canvas.toDataURL('image/jpeg'))
            setShowCanvas(false)
          }
          drawImg.src = canvasData
        }
        img.src = value
      }
    }
    
    return (
      <div>
        {value ? (
          <div style={{ position:'relative' }}>
            <img 
              src={value} 
              alt="" 
              style={{ 
                width:'100%', 
                borderRadius:10, 
                border:'1px solid #e4e6eb', 
                maxHeight:180, 
                objectFit:'cover', 
                display:'block' 
              }}
            />
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button 
                onClick={() => setShowCanvas(true)} 
                style={{ 
                  flex:1, 
                  background:'#4a90d9', 
                  color:'white', 
                  fontWeight:700, 
                  fontSize:12, 
                  padding:'8px 12px', 
                  borderRadius:8, 
                  border:'none', 
                  cursor:'pointer' 
                }}
              >
                Dessiner
              </button>
              <button 
                onClick={() => onChange('')} 
                style={{ 
                  flex:1, 
                  background:'#e74c3c', 
                  color:'white', 
                  fontWeight:700, 
                  fontSize:12, 
                  padding:'8px 12px', 
                  borderRadius:8, 
                  border:'none', 
                  cursor:'pointer' 
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => ref.current?.click()} 
            style={{ 
              width:'100%', 
              border:'2px dashed #b8c8dc', 
              borderRadius:12, 
              background:'#f4f7fb', 
              display:'flex', 
              flexDirection:'column', 
              alignItems:'center', 
              justifyContent:'center', 
              padding:'26px 16px', 
              cursor:'pointer', 
              gap:4, 
              boxSizing:'border-box' 
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="3" y="7" width="26" height="19" rx="3" stroke="#8a9ab5" strokeWidth="1.4"/>
              <path d="M3 22l7-6 5 5 5-4 7 8" stroke="#8a9ab5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 11v6M13 14h6" stroke="#8a9ab5" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize:14, fontWeight:600, color:'#8a9ab5', marginTop:4 }}>Prendre une photo</span>
            <span style={{ fontSize:12, color:'#b0bcc9' }}>ou sélectionnez un fichier</span>
          </button>
        )}
        
        <input 
          ref={ref} 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ display:'none' }}
        />
        
        {/* Modal pour le dessin */}
        {showCanvas && value && (
          <div style={{
            position:'fixed',
            top:0,
            left:0,
            right:0,
            bottom:0,
            background:'rgba(0,0,0,0.8)',
            zIndex:1000,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            padding:20
          }}>
            <div style={{
              background:'white',
              borderRadius:16,
              padding:20,
              maxWidth:600,
              width:'100%'
            }}>
              <h3 style={{ margin:'0 0 16px', fontSize:18 }}>Dessiner sur la photo</h3>
              <div style={{ position:'relative', marginBottom:16 }}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  style={{
                    width:'100%',
                    height:300,
                    border:'2px solid #e4e6eb',
                    borderRadius:8,
                    cursor:'crosshair',
                    backgroundImage:`url(${value})`,
                    backgroundSize:'contain',
                    backgroundRepeat:'no-repeat',
                    backgroundPosition:'center'
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button 
                  onClick={clearCanvas}
                  style={{
                    background:'#e4e6eb',
                    color:'#4a5568',
                    fontWeight:700,
                    fontSize:14,
                    padding:'10px 20px',
                    borderRadius:8,
                    border:'none',
                    cursor:'pointer'
                  }}
                >
                  Effacer
                </button>
                <button 
                  onClick={() => setShowCanvas(false)}
                  style={{
                    background:'#e4e6eb',
                    color:'#4a5568',
                    fontWeight:700,
                    fontSize:14,
                    padding:'10px 20px',
                    borderRadius:8,
                    border:'none',
                    cursor:'pointer'
                  }}
                >
                  Annuler
                </button>
                <button 
                  onClick={applyDrawing}
                  style={{
                    background:'#4a90d9',
                    color:'white',
                    fontWeight:700,
                    fontSize:14,
                    padding:'10px 20px',
                    borderRadius:8,
                    border:'none',
                    cursor:'pointer'
                  }}
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Composant Signature
  const SigPad = ({ onChange }: { onChange: (v: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    
    const gp = useCallback((e: MouseEvent|Touch, c: HTMLCanvasElement) => {
      const r = c.getBoundingClientRect()
      return { 
        x:(e.clientX-r.left)*(c.width/r.width), 
        y:(e.clientY-r.top)*(c.height/r.height) 
      }
    }, [])
    
    useEffect(() => {
      const c = canvasRef.current
      if (!c) return
      const ctx = c.getContext('2d')!
      
      const dn = (e: MouseEvent|TouchEvent) => { 
        e.preventDefault()
        drawing.current=true
        const p=gp('touches' in e?e.touches[0]:e,c)
        ctx.beginPath()
        ctx.moveTo(p.x,p.y)
      }
      
      const mv = (e: MouseEvent|TouchEvent) => { 
        e.preventDefault()
        if(!drawing.current) return
        const p=gp('touches' in e?e.touches[0]:e,c)
        ctx.lineTo(p.x,p.y)
        ctx.strokeStyle='#1a1f36'
        ctx.lineWidth=2.5
        ctx.lineCap='round'
        ctx.lineJoin='round'
        ctx.stroke()
        onChange(c.toDataURL())
      }
      
      const up = () => { drawing.current=false }
      
      c.addEventListener('mousedown',dn)
      c.addEventListener('mousemove',mv)
      c.addEventListener('mouseup',up)
      c.addEventListener('touchstart',dn,{passive:false})
      c.addEventListener('touchmove',mv,{passive:false})
      c.addEventListener('touchend',up)
      
      return () => { 
        c.removeEventListener('mousedown',dn)
        c.removeEventListener('mousemove',mv)
        c.removeEventListener('mouseup',up)
        c.removeEventListener('touchstart',dn)
        c.removeEventListener('touchmove',mv)
        c.removeEventListener('touchend',up)
      }
    }, [gp, onChange])
    
    const clear = () => { 
      const c=canvasRef.current
      if(!c) return
      c.getContext('2d')!.clearRect(0,0,c.width,c.height)
      onChange('')
    }
    
    return (
      <div>
        <div style={{ position:'relative' }}>
          <canvas 
            ref={canvasRef} 
            width={700} 
            height={260} 
            style={{
              width:'100%',
              height:130,
              border:'1px solid #e4e6eb',
              borderRadius:12,
              background:'white',
              cursor:'crosshair',
              display:'block'
            }}
          />
          <span style={{ position:'absolute', bottom:10, left:14, fontSize:12, color:'#c0c8d4', pointerEvents:'none' }}>Signez ici</span>
        </div>
        <div style={{ display:'flex', gap:12, marginTop:12 }}>
          <button 
            style={{
              flex:1,
              background:'#1a1f36',
              color:'white',
              fontWeight:800,
              fontSize:14,
              padding:'12px',
              borderRadius:12,
              border:'none',
              cursor:'pointer'
            }}
          >
            Valider la signature
          </button>
          <button 
            onClick={clear}
            style={{
              background:'#e4e6eb',
              color:'#4a5568',
              fontWeight:700,
              fontSize:14,
              padding:'12px 20px',
              borderRadius:12,
              border:'none',
              cursor:'pointer'
            }}
          >
            Effaceur
          </button>
        </div>
      </div>
    )
  }

  // Composant Section pour le formulaire
  const SectionForm = ({ 
    section, 
    index, 
    isRetour = false 
  }: { 
    section: SectionData
    index: number
    isRetour?: boolean 
  }) => {
    const prefix = isRetour ? 'Retour' : 'Départ'
    const photoField = isRetour ? 'photoRetour' : 'photoDepart'
    const damageField = isRetour ? 'damageRetour' : 'damageDepart'
    const noteField = isRetour ? 'noteRetour' : 'noteDepart'
    const updateFn = isRetour ? updateRetourSection : updateDepartSection
    
    return (
      <div style={C}>
        <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>
          {section.name} ({prefix})
        </h2>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#4a90d9', marginBottom:6 }}>
              Photo - {section.name} ({prefix})
            </div>
            <PhotoUpWithCanvas 
              value={section[photoField]} 
              onChange={(v) => updateFn(index, photoField, v)} 
            />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>
              Dommage ({prefix})
            </div>
            <SelComp 
              value={section[damageField]} 
              onChange={(v) => updateFn(index, damageField, v)}
            >
              {DAMAGE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </SelComp>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>
              Note ({prefix})
            </div>
            <textarea 
              value={section[noteField]} 
              onChange={(e) => updateFn(index, noteField, e.target.value)}
              rows={3}
              style={{
                ...I,
                resize:'vertical',
                fontFamily:'inherit'
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // HOME
  if (view==='home') return (
    <div style={{ background:'#f0f2f5', minHeight:'100vh', padding:16, display:'flex', flexDirection:'column', gap:16 }}>
      <div style={C}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:72, height:72, background:'#f5c518', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:15, color:'#1a1f36', margin:'0 auto 16px' }}>FLYCAR</div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#1a1f36', margin:'0 0 6px' }}>Inspection FLYCAR</h1>
          <p style={{ color:'#8a94a6', fontSize:14, margin:'0 0 20px' }}>États des lieux avec photos, signatures et PDF</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button style={{ background:'#f5c518', color:'#1a1f36', fontWeight:800, fontSize:14, padding:'11px 20px', borderRadius:14, border:'none', cursor:'pointer' }}>Accueil</button>
            <button onClick={()=>{setForm({...form, depart: emptyDepartRetour(), retour: emptyDepartRetour()}); setView('form')}} style={{ background:'#1a1f36', color:'white', fontWeight:800, fontSize:14, padding:'11px 20px', borderRadius:14, border:'none', cursor:'pointer' }}>Nouveau dossier</button>
          </div>
        </div>
      </div>
      
      <div style={C}>
        <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>Dossiers enregistrés</h2>
        {dossiers.length===0 ? (
          <p style={{ color:'#8a94a6', fontSize:14, textAlign:'center', padding:'24px 0' }}>Aucun dossier pour l'instant.</p>
        ) : (
          dossiers.map(d => (
            <div key={d.id} style={{ background:'#f8f9fb', borderRadius:16, padding:16, marginBottom:12 }}>
              {/* Immatriculation en gros + contrat */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                <div style={{ background:'#1a1f36', color:'#f5c518', fontWeight:900, fontSize:16, fontFamily:'monospace', padding:'4px 12px', borderRadius:8, letterSpacing:2 }}>
                  {d.plate && d.plate !== '—' ? d.plate : '—'}
                </div>
                {d.contractNum && d.contractNum !== '—' && (
                  <div style={{ fontSize:12, color:'#8a94a6', fontWeight:600 }}>#{d.contractNum}</div>
                )}
                {d.retour && (
                  <div style={{ marginLeft:'auto', background:'#e8f5e9', color:'#27ae60', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:20 }}>✓ Retour</div>
                )}
              </div>
              <div style={{ color:'#4a5568', fontSize:13, fontWeight:600, marginBottom:2 }}>{d.clientName !== '—' ? d.clientName : ''}</div>
              <div style={{ color:'#8a94a6', fontSize:12, marginBottom:12 }}>
                Départ: {d.depart.dateLabel}
                {d.retour && <span> · Retour: {d.retour.dateLabel}</span>}
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button 
                  onClick={() => { setSelected(d); setView('detail') }}
                  style={{ flex:1, minWidth:80, background:'#1a1f36', color:'white', fontWeight:800, fontSize:13, padding:'10px', borderRadius:12, border:'none', cursor:'pointer' }}
                >
                  📋 Ouvrir
                </button>
                <button 
                  onClick={() => sendByEmail(d)}
                  style={{ flex:1, minWidth:80, background:'#4a90d9', color:'white', fontWeight:800, fontSize:13, padding:'10px', borderRadius:12, border:'none', cursor:'pointer' }}
                >
                  ✉️ Mail
                </button>
                {!d.retour && (
                  <button 
                    onClick={() => {
                      setSelected(d)
                      setForm({
                        ...form,
                        contractNum: d.contractNum,
                        plate: d.plate,
                        clientName: d.clientName,
                        society: d.society,
                        agence: d.agence,
                        lieu: d.lieu,
                        agentName: d.agentName,
                        agentEmail: d.agentEmail,
                        clientEmail: d.clientEmail,
                        clientPhone: d.clientPhone,
                        clientPermis: d.clientPermis,
                        marque: d.marque,
                        modele: d.modele,
                        carburantType: d.carburantType,
                        retour: emptyDepartRetour()
                      })
                      setView('retour')
                    }}
                    style={{ flex:1, minWidth:80, background:'#e74c3c', color:'white', fontWeight:800, fontSize:13, padding:'10px', borderRadius:12, border:'none', cursor:'pointer' }}
                  >
                    🔄 Retour
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {toast && (
        <div style={{ 
          position:'fixed', 
          bottom:28, 
          left:'50%', 
          transform:'translateX(-50%)', 
          background:'#1a1f36', 
          color:'white', 
          padding:'10px 22px', 
          borderRadius:30, 
          fontSize:13, 
          fontWeight:600, 
          zIndex:9999, 
          whiteSpace:'nowrap' 
        }}>
          {toast}
        </div>
      )}
    </div>
  )

  // DETAIL
  const detailInfoRows: string[][] = selected ? [
    ['Contrat', selected.contractNum],
    ['Locataire', selected.clientName],
    ['Type', selected.type],
    ['Date Départ', selected.depart.dateLabel],
    ...(selected.retour ? [['Date Retour', selected.retour.dateLabel]] : []),
    ['Kilométrage Départ', selected.depart.km ? Number(selected.depart.km).toLocaleString('fr-FR') + ' km' : '—'],
    ...(selected.retour ? [['Kilométrage Retour', selected.retour.km ? Number(selected.retour.km).toLocaleString('fr-FR') + ' km' : '—']] : []),
    ['Carburant Départ', `${selected.depart.carburantLevel} (${selected.carburantType})`],
    ...(selected.retour ? [['Carburant Retour', `${selected.retour.carburantLevel} (${selected.carburantType})`]] : []),
  ] : []

  if (view==='detail' && selected) return (
    <div style={{ background:'#f0f2f5', minHeight:'100vh', padding:16, display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:'#1a1f36', margin:0 }}>{selected.plate}</h1>
        <button 
          onClick={() => setView('home')}
          style={{
            background:'#e4e6eb',
            color:'#1a1f36',
            fontWeight:700,
            fontSize:13,
            padding:'8px 16px',
            borderRadius:12,
            border:'none',
            cursor:'pointer'
          }}
        >
          ← Retour
        </button>
      </div>
      
      <div style={C}>
        <h2 style={{ fontSize:18, fontWeight:900, color:'#1a1f36', marginBottom:14, marginTop:0 }}>Informations</h2>
        {detailInfoRows.map((item) => (
          <div key={item[0]} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f2f5', fontSize:14 }}>
            <span style={{ color:'#8a94a6' }}>{item[0]}</span>
            <span style={{ fontWeight:600, color:'#1a1f36' }}>{item[1] || '—'}</span>
          </div>
        ))}
      </div>
      
      <div style={C}>
        <h2 style={{ fontSize:18, fontWeight:900, color:'#1a1f36', marginBottom:14, marginTop:0 }}>
          Photos Comparées (Départ vs Retour)
        </h2>
        {selected.depart.sections
          .filter(s => s.photoDepart || s.photoRetour || s.damageDepart !== 'Rien à signaler' || s.damageRetour !== 'Rien à signaler' || s.noteDepart || s.noteRetour)
          .map((s, i) => (
            <div key={i} style={{ marginBottom:20, paddingBottom:20, borderBottom:'1px solid #f0f2f5' }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#1a1f36', marginBottom:12 }}>{s.name}</div>
              
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {/* Départ */}
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#4a90d9', marginBottom:6 }}>DÉPART</div>
                  {s.photoDepart && (
                    <img 
                      src={s.photoDepart} 
                      alt={`${s.name} départ`} 
                      style={{ 
                        width:'100%', 
                        borderRadius:8, 
                        marginBottom:8, 
                        maxHeight:160, 
                        objectFit:'cover', 
                        display:'block',
                        border: '2px solid #4a90d9'
                      }}
                    />
                  )}
                  {s.damageDepart !== 'Rien à signaler' ? (
                    <span style={{ display:'inline-block', background:'#fff0f0', color:'#c0392b', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:600 }}>
                      ⚠ {s.damageDepart}
                    </span>
                  ) : (
                    <span style={{ display:'inline-block', background:'#f0fff4', color:'#27ae60', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:600 }}>
                      ✓ RAS
                    </span>
                  )}
                  {s.noteDepart && (
                    <p style={{ fontSize:13, color:'#4a5568', marginTop:6, fontStyle:'italic' }}>{s.noteDepart}</p>
                  )}
                </div>
                
                {/* Retour (si existe) */}
                {selected.retour && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'#e74c3c', marginBottom:6 }}>RETOUR</div>
                    {s.photoRetour && (
                      <img 
                        src={s.photoRetour} 
                        alt={`${s.name} retour`} 
                        style={{ 
                          width:'100%', 
                          borderRadius:8, 
                          marginBottom:8, 
                          maxHeight:160, 
                          objectFit:'cover', 
                          display:'block',
                          border: '2px solid #e74c3c'
                        }}
                      />
                    )}
                    {s.damageRetour !== 'Rien à signaler' ? (
                      <span style={{ display:'inline-block', background:'#fff0f0', color:'#c0392b', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:600 }}>
                        ⚠ {s.damageRetour}
                      </span>
                    ) : (
                      <span style={{ display:'inline-block', background:'#f0fff4', color:'#27ae60', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:600 }}>
                        ✓ RAS
                      </span>
                    )}
                    {s.noteRetour && (
                      <p style={{ fontSize:13, color:'#4a5568', marginTop:6, fontStyle:'italic' }}>{s.noteRetour}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
      
      <div style={{ display:'flex', gap:12, flexDirection:'column' }}>
        <button 
          onClick={() => generatePDF(selected)}
          style={{
            width:'100%',
            background:'#1a1f36',
            color:'white',
            fontWeight:800,
            fontSize:15,
            padding:'14px',
            borderRadius:14,
            border:'none',
            cursor:'pointer'
          }}
        >
          Télécharger le PDF
        </button>
        
        <button 
          onClick={() => sendByEmail(selected)}
          style={{
            width:'100%',
            background:'#4a90d9',
            color:'white',
            fontWeight:800,
            fontSize:15,
            padding:'14px',
            borderRadius:14,
            border:'none',
            cursor:'pointer'
          }}
        >
          Envoyer par Mail
        </button>
        
        {!selected.retour && (
          <button 
            onClick={() => {
              setForm({
                ...form,
                contractNum: selected.contractNum,
                plate: selected.plate,
                clientName: selected.clientName,
                society: selected.society,
                agence: selected.agence,
                lieu: selected.lieu,
                agentName: selected.agentName,
                agentEmail: selected.agentEmail,
                clientEmail: selected.clientEmail,
                clientPhone: selected.clientPhone,
                clientPermis: selected.clientPermis,
                marque: selected.marque,
                modele: selected.modele,
                carburantType: selected.carburantType,
                retour: emptyDepartRetour()
              })
              setView('retour')
            }}
            style={{
              width:'100%',
              background:'#e74c3c',
              color:'white',
              fontWeight:800,
              fontSize:15,
              padding:'14px',
              borderRadius:14,
              border:'none',
              cursor:'pointer'
            }}
          >
            Reprise Dossier (Retour)
          </button>
        )}
      </div>
    </div>
  )

  // FORMULAIRE DÉPART
  if (view==='form') return (
    <div style={{ background:'#f0f2f5', minHeight:'100vh' }}>
      <div style={{ position:'sticky', top:0, zIndex:10, background:'#f0f2f5', padding:'16px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:18, fontWeight:900, color:'#1a1f36' }}>Nouvel État des Lieux (DÉPART)</span>
        <button 
          onClick={() => setView('home')}
          style={{
            background:'#e4e6eb',
            color:'#1a1f36',
            fontWeight:700,
            fontSize:13,
            padding:'8px 16px',
            borderRadius:12,
            border:'none',
            cursor:'pointer'
          }}
        >
          Annuler
        </button>
      </div>

      <div style={{ padding:'0 16px 40px', display:'flex', flexDirection:'column', gap:16 }}>
        <div style={C}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>Informations générales</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Société</div>
              <input value={form.society} onChange={e => sf('society', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Numéro de contrat</div>
              <input value={form.contractNum} onChange={e => sf('contractNum', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Agence</div>
              <input value={form.agence} onChange={e => sf('agence', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Lieu</div>
              <input value={form.lieu} onChange={e => sf('lieu', e.target.value)} style={I}/>
            </div>
          </div>
        </div>

        <div style={C}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>Agent</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Nom de l'agent</div>
              <input value={form.agentName} onChange={e => sf('agentName', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Email agent</div>
              <input type="email" value={form.agentEmail} onChange={e => sf('agentEmail', e.target.value)} style={I}/>
            </div>
          </div>
        </div>

        <div style={C}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>Locataire</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Nom du locataire</div>
              <input value={form.clientName} onChange={e => sf('clientName', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Email du locataire</div>
              <input type="email" value={form.clientEmail} onChange={e => sf('clientEmail', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Téléphone</div>
              <input type="tel" value={form.clientPhone} onChange={e => sf('clientPhone', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Numéro de permis</div>
              <input value={form.clientPermis} onChange={e => sf('clientPermis', e.target.value)} style={I}/>
            </div>
          </div>
        </div>

        <div style={C}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>Véhicule</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Immatriculation</div>
              <input value={form.plate} onChange={e => sf('plate', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Marque</div>
              <input value={form.marque} onChange={e => sf('marque', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Modèle</div>
              <input value={form.modele} onChange={e => sf('modele', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Kilométrage (Départ)</div>
              <input type="number" value={form.depart.km} onChange={e => updateDepart('km', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Type de carburant</div>
              <input value={form.carburantType} onChange={e => sf('carburantType', e.target.value)} style={I}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Niveau de carburant (Départ)</div>
              <SelComp value={form.depart.carburantLevel} onChange={v => updateDepart('carburantLevel', v)}>
                {FUEL_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </SelComp>
            </div>
          </div>
        </div>

        {form.depart.sections.map((s, i) => (
          <SectionForm key={s.name} section={s} index={i} isRetour={false} />
        ))}

        <div style={C}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>Signature Agent (Départ)</h2>
          <SigPad onChange={v => updateDepart('agentSig', v)}/>
        </div>
        
        <div style={C}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>Signature Locataire (Départ)</h2>
          <SigPad onChange={v => updateDepart('clientSig', v)}/>
        </div>

        <button 
          onClick={handleSaveDepart}
          style={{
            width:'100%',
            background:'#1a1f36',
            color:'white',
            fontWeight:900,
            fontSize:15,
            padding:'14px',
            borderRadius:16,
            border:'none',
            cursor:'pointer'
          }}
        >
          Enregistrer le Départ
        </button>
        
        <button 
          onClick={() => generatePDF({...form, depart: form.depart})}
          style={{
            width:'100%',
            background:'#f5c518',
            color:'#1a1f36',
            fontWeight:900,
            fontSize:15,
            padding:'14px',
            borderRadius:16,
            border:'none',
            cursor:'pointer'
          }}
        >
          Télécharger le PDF (Départ)
        </button>
      </div>
      
      {toast && (
        <div style={{ 
          position:'fixed', 
          bottom:28, 
          left:'50%', 
          transform:'translateX(-50%)', 
          background:'#1a1f36', 
          color:'white', 
          padding:'10px 22px', 
          borderRadius:30, 
          fontSize:13, 
          fontWeight:600, 
          zIndex:9999, 
          whiteSpace:'nowrap' 
        }}>
          {toast}
        </div>
      )}
    </div>
  )

  // FORMULAIRE RETOUR
  if (view==='retour' && selected) return (
    <div style={{ background:'#f0f2f5', minHeight:'100vh' }}>
      <div style={{ position:'sticky', top:0, zIndex:10, background:'#f0f2f5', padding:'16px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:18, fontWeight:900, color:'#1a1f36' }}>Reprise Dossier (RETOUR) - {selected.plate}</span>
        <button 
          onClick={() => { setSelected(null); setView('home') }}
          style={{
            background:'#e4e6eb',
            color:'#1a1f36',
            fontWeight:700,
            fontSize:13,
            padding:'8px 16px',
            borderRadius:12,
            border:'none',
            cursor:'pointer'
          }}
        >
          Annuler
        </button>
      </div>

      <div style={{ padding:'0 16px 40px', display:'flex', flexDirection:'column', gap:16 }}>
        <div style={C}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>
            Informations du véhicule (identiques au départ)
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:14 }}>
            <div>
              <div style={{ fontSize:11, color:'#8a94a6', fontWeight:600 }}>Contrat</div>
              <div style={{ fontWeight:600 }}>{selected.contractNum}</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'#8a94a6', fontWeight:600 }}>Immatriculation</div>
              <div style={{ fontWeight:600 }}>{selected.plate}</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'#8a94a6', fontWeight:600 }}>Marque / Modèle</div>
              <div style={{ fontWeight:600 }}>{selected.marque} {selected.modele}</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'#8a94a6', fontWeight:600 }}>Carburant</div>
              <div style={{ fontWeight:600 }}>{selected.carburantType}</div>
            </div>
          </div>
        </div>

        <div style={C}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>Véhicule (Retour)</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Kilométrage (Retour)</div>
              <input 
                type="number" 
                value={form.retour.km} 
                onChange={e => updateRetour('km', e.target.value)} 
                style={I}
                placeholder={`Départ: ${selected.depart.km || '—'}`}
              />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#4a5b7a', marginBottom:6 }}>Niveau de carburant (Retour)</div>
              <SelComp 
                value={form.retour.carburantLevel} 
                onChange={v => updateRetour('carburantLevel', v)}
              >
                {FUEL_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </SelComp>
            </div>
          </div>
        </div>

        {form.retour.sections.map((s, i) => (
          <SectionForm key={s.name} section={s} index={i} isRetour={true} />
        ))}

        <div style={C}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>Signature Agent (Retour)</h2>
          <SigPad onChange={v => updateRetour('agentSig', v)}/>
        </div>
        
        <div style={C}>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#1a1f36', marginBottom:16, marginTop:0 }}>Signature Locataire (Retour)</h2>
          <SigPad onChange={v => updateRetour('clientSig', v)}/>
        </div>

        <button 
          onClick={handleSaveRetour}
          style={{
            width:'100%',
            background:'#e74c3c',
            color:'white',
            fontWeight:900,
            fontSize:15,
            padding:'14px',
            borderRadius:16,
            border:'none',
            cursor:'pointer'
          }}
        >
          Enregistrer le Retour
        </button>
      </div>
      
      {toast && (
        <div style={{ 
          position:'fixed', 
          bottom:28, 
          left:'50%', 
          transform:'translateX(-50%)', 
          background:'#1a1f36', 
          color:'white', 
          padding:'10px 22px', 
          borderRadius:30, 
          fontSize:13, 
          fontWeight:600, 
          zIndex:9999, 
          whiteSpace:'nowrap' 
        }}>
          {toast}
        </div>
      )}
    </div>
  )

  return null
}