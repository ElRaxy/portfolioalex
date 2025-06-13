import React from 'react'
import CV from '../../assets/cv.pdf'
import { Link } from 'react-scroll'

function CTA() {
  return (
    <div className="cta">
      <a href={CV} download className="btn">Download CV</a>
      <Link
        to="contact"
        spy={true}
        smooth={true}
        offset={-80}
        duration={500}
        className="btn btn-primary"
      >
        Let's Talk
      </Link>
    </div>
  )
}

export default CTA
