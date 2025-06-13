import React from 'react'
import { useTranslation } from 'react-i18next'
import './portfolio.css'
import IMG1 from '../../assets/portfolio1.png'
import IMG2 from '../../assets/portfolio2.png'
import IMG3 from '../../assets/portfolio3.png'
import IMG4 from '../../assets/portfolio4.png'
import IMG5 from '../../assets/portfolio5.png'
import IMG6 from '../../assets/portfolio6.png'

function Portfolio() {
  const { t } = useTranslation();

  const data = [
    {
      id: 1,
      image: IMG1,
      title: t('portfolio.projects.0.title'),
      github: 'https://github.com/ElRaxy/AdminDashBoard',
      demo: 'https://admin-dash-board-alex.vercel.app/'
    },
    {
      id: 2,
      image: IMG2,
      title: t('portfolio.projects.1.title'),
      github: 'https://github.com/ElRaxy/E-comers',
      demo: 'https://componetsstore.vercel.app/'
    },
    {
      id: 3,
      image: IMG3,
      title: t('portfolio.projects.2.title'),
      github: 'https://github.com',
      demo: 'https://dribbble.com/shots/17290917-Eclipse-Figma-dashboard-UI-kit-for-data-design-web-apps'
    },
    {
      id: 4,
      image: IMG4,
      title: t('portfolio.projects.3.title'),
      github: 'http://github.com/ElRaxy/Battleship_Python',
      demo: 'https://github.com/ElRaxy/Battleship_Python'
    },
    {
      id: 5,
      image: IMG5,
      title: t('portfolio.projects.4.title'),
      github: 'https://github.com/ElRaxy/Pong_JS_Alex_Mico',
      demo: 'https://ponggamealexm.vercel.app/'
    },
    {
      id: 6,
      image: IMG6,
      title: t('portfolio.projects.5.title'),
      github: 'https://github.com/ElRaxy/SnakeGame-Alex',
      demo: 'https://snakegame-snowy-two.vercel.app/'
    }
  ]

  return (
    <section id="portfolio">
      <h5>{t('portfolio.subtitle')}</h5>
      <h2>{t('portfolio.title')}</h2>

      <div className="container portfolio__container">
        {data.map(({ id, image, title, github, demo }) => {
          return (
            <article key={id} className="portfolio__item">
              <div className="portfolio__item-image">
                <img src={image} alt={title} />
              </div>
              <h3>{title}</h3>
              <div className="portfolio__item-cta">
                <a href={github} className="btn" target="_blank" rel="noreferrer">{t('portfolio.projects.0.github')}</a>
                <a href={demo} className="btn btn-primary" target="_blank" rel="noreferrer">{t('portfolio.projects.0.demo')}</a>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default Portfolio
