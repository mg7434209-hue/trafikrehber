import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
export default function SearchForm({ initialValue = '', id = 'site-search' }) {
  const [q, setQ] = useState(initialValue);
  const navigate = useNavigate();
  function submit(e) { e.preventDefault(); if (q.trim().length >= 2) navigate(`/blog?q=${encodeURIComponent(q.trim())}`); }
  return <form className="search-form" role="search" onSubmit={submit}><label htmlFor={id} className="sr-only">Rehberlerde ara</label><Icon name="search" /><input id={id} type="search" placeholder="Ceza, sigorta, ehliyet…" value={q} onChange={e => setQ(e.target.value)} minLength={2} maxLength={160} required /><button type="submit" className="btn btn-primary">Ara <Icon name="arrow" size={17} /></button></form>;
}
