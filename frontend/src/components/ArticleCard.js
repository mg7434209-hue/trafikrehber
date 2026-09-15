import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_NAMES } from '../services/site';
import Icon from './Icon';
export default function ArticleCard({ article }) {
  return <Link className="guide-card" to={`/blog/${article.slug}`}><span className="badge badge-blue">{CATEGORY_NAMES[article.category] || 'Rehber'}</span><h3>{article.title}</h3><p>{article.meta_description}</p><div className="guide-card-meta"><span><Icon name="clock" size={15} /> {article.reading_time_min || 5} dk okuma</span><Icon name="arrow" size={20} /></div></Link>;
}
