// Single source of truth for the provider form, validation, admin review and public listing.
// type: text | textarea | tel | email | url | number | time | select
const F = (key, label, type, extra = {}) => ({ key, label, type, ...extra });

const TEMPLATE = {
  version: 1,
  entities: {
    profile: {
      label: 'Hospital / Clinic profile',
      sections: [
        { title: 'Basic info', fields: [
          F('name', 'Name', 'text', { required: true, max: 150 }),
          F('category', 'Type', 'select', { required: true, options: ['hospital', 'clinic', 'diagnostic', 'wellness', 'homecare', 'ambulance', 'bloodbank'] }),
          F('registration_no', 'Registration number', 'text', { required: true, max: 100 }),
          F('contact_person', 'Contact person', 'text', { max: 120 }),
          F('description', 'About', 'textarea', { required: true, max: 2000 }),
        ]},
        { title: 'Location', fields: [
          F('address', 'Address', 'textarea', { required: true, max: 300 }),
          F('city', 'City', 'text', { required: true, max: 100 }),
          F('district', 'District', 'text', { max: 100 }),
          F('latitude', 'Latitude', 'number', { min: -90, max: 90 }),
          F('longitude', 'Longitude', 'number', { min: -180, max: 180 }),
        ]},
        { title: 'Contact & timings', fields: [
          F('phone', 'Phone', 'tel', { required: true, max: 30 }),
          F('email', 'Email', 'email', { required: true, max: 200 }),
          F('website', 'Website', 'url', { max: 200 }),
          F('opening_hours', 'Opening hours', 'textarea', { max: 300, placeholder: 'Sun-Fri 08:00-18:00, Sat 09:00-14:00' }),
        ]},
        { title: 'Photos', fields: [
          F('cover_image_url', 'Cover photo URL', 'url', { required: true, max: 500 }),
          F('logo_url', 'Logo URL', 'url', { max: 500 }),
        ]},
      ],
    },
    doctor: {
      label: 'Doctor',
      sections: [
        { title: 'Doctor', fields: [
          F('name', 'Doctor name', 'text', { required: true, max: 120 }),
          F('department', 'Department', 'text', { required: true, max: 100 }),
          F('specialization', 'Specialization', 'text', { max: 120 }),
          F('qualification', 'Qualification', 'text', { max: 150 }),
          F('nmc_no', 'NMC / license no.', 'text', { max: 60 }),
          F('experience_years', 'Experience (years)', 'number', { min: 0, max: 80 }),
          F('room', 'Room', 'text', { max: 30 }),
          F('opd_fee', 'OPD fee (INR)', 'number', { required: true, min: 0, max: 1000000 }),
          F('followup_fee', 'Follow-up fee (INR)', 'number', { min: 0, max: 1000000 }),
          F('shift_timings', 'Timings', 'text', { max: 120, placeholder: 'Sun-Fri 10:00-14:00' }),
          F('avatar_url', 'Photo URL', 'url', { max: 500 }),
        ]},
      ],
    },
    service: {
      label: 'Service / Package',
      sections: [
        { title: 'Service', fields: [
          F('name', 'Service name', 'text', { required: true, max: 150 }),
          F('category', 'Category', 'text', { max: 100 }),
          F('department', 'Department', 'text', { max: 100 }),
          F('price', 'Price (INR)', 'number', { required: true, min: 0, max: 10000000 }),
          F('duration_min', 'Duration (minutes)', 'number', { min: 1, max: 1440 }),
          F('description', 'Description', 'textarea', { max: 1000 }),
        ]},
      ],
    },
  },
};

// Return all fields allowed for the selected entity.
const allowedFields = (entity) => TEMPLATE.entities[entity].sections.flatMap((s) => s.fields);

function validate(entity, action, input) {
  const def = TEMPLATE.entities[entity];
  if (!def) return { error: 'Invalid entity.' };
  if (action === 'archive') return { data: {} };
  const out = {}; const errors = [];
  for (const f of allowedFields(entity)) {
    let v = input ? input[f.key] : undefined;
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      if (f.required && action !== 'partial') errors.push(`${f.label} is required.`);
      continue;
    }
    if (f.type === 'number') {
      const n = Number(v);
      if (!Number.isFinite(n)) { errors.push(`${f.label} must be a number.`); continue; }
      if (f.min !== undefined && n < f.min) { errors.push(`${f.label} must be at least ${f.min}.`); continue; }
      if (f.max !== undefined && n > f.max) { errors.push(`${f.label} cannot exceed ${f.max}.`); continue; }
      out[f.key] = n;
    } else if (f.type === 'select') {
      if (!f.options.includes(String(v))) { errors.push(`${f.label} is invalid.`); continue; }
      out[f.key] = String(v);
    } else if (f.type === 'email') {
      const s = String(v).trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) { errors.push(`${f.label} is not a valid email address.`); continue; }
      out[f.key] = s;
    } else if (f.type === 'url') {
      const s = String(v).trim();
      if (!/^https?:\/\//i.test(s)) { errors.push(`${f.label} must start with http:// or https://.`); continue; }
      out[f.key] = s.slice(0, f.max || 500);
    } else {
      const s = String(v).trim();
      if (f.max && s.length > f.max) { errors.push(`${f.label} cannot exceed ${f.max} characters.`); continue; }
      out[f.key] = s;
    }
  }
  if (errors.length) return { error: errors.join(', ') };
  return { data: out };
}

module.exports = { TEMPLATE, validate, allowedFields };
