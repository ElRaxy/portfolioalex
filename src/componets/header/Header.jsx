import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './header.css'
import strevImage from '../../assets/projects/strev-product.png'
import serenoImage from '../../assets/projects/sereno-session-overview.webp'
import { caseHref } from '../../lib/routing'
import CTA from './CTA'
import HeaderSocials from './HeaderSocials'

const Header = () => {
  const { t, i18n } = useTranslation()
  const [activeProduct, setActiveProduct] = useState('strev')
  const language = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0]
  const projects = t('portfolio.projects', { returnObjects: true })
  const productBySlug = Array.isArray(projects)
    ? Object.fromEntries(projects.map((project) => [project.slug, project]))
    : {}
  const products = [
    {
      ...productBySlug.strev,
      slug: 'strev',
      title: productBySlug.strev?.title || 'Strev',
      src: strevImage,
      width: 1440,
      height: 900,
    },
    {
      ...productBySlug.sereno,
      slug: 'sereno',
      title: productBySlug.sereno?.title || 'Sereno',
      src: serenoImage,
      width: 1560,
      height: 720,
    },
  ]

  return (
    <header id="home" className="hero">
      <div className="hero__copy">
        <p className="hero__title">{t('header.title')}</p>

        <div className="hero__intro">
          <h1 className="hero__name">{t('header.name')}</h1>
          <p className="hero__tagline">{t('header.tagline')}</p>
          <p className="hero__support">{t('header.support')}</p>
        </div>

        <CTA />

        <div className="hero__signature">
          <p className="hero__availability">{t('header.availability')}</p>
          <HeaderSocials />
        </div>
      </div>

      <div
        aria-label={t('header.product_selector_label')}
        className="hero__product-selector"
        role="group"
      >
        {products.map((product) => (
          <button
            aria-controls={`hero-product-${product.slug}`}
            aria-pressed={activeProduct === product.slug}
            className="hero__product-selector-button"
            key={product.slug}
            onClick={() => setActiveProduct(product.slug)}
            type="button"
          >
            {product.title}
          </button>
        ))}
      </div>

      <nav
        className="hero__stage"
        aria-label={t('header.product_canvas_label')}
        data-active-product={activeProduct}
      >
        {products.map((product, index) => (
          <div
            className={`hero__preview hero__preview--${product.slug}`}
            data-active={activeProduct === product.slug}
            id={`hero-product-${product.slug}`}
            key={product.slug}
          >
            <span className="hero__preview-media">
              <img
                src={product.src}
                alt=""
                width={product.width}
                height={product.height}
                loading="eager"
                decoding="async"
                fetchPriority={index === 0 ? 'high' : undefined}
              />
            </span>
            <span className="hero__preview-caption">
              <strong>{product.title}</strong>
              <span className="hero__preview-label">{product.label}</span>
              <span className="hero__preview-proof">{product.proof}</span>
              <a
                className="hero__preview-link"
                href={caseHref(language, product.slug)}
              >
                {t('header.open_case', { project: product.title })}
              </a>
            </span>
          </div>
        ))}
      </nav>
    </header>
  )
}

export default Header
