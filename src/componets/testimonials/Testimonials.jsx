import React from 'react'
import { useTranslation } from 'react-i18next'
import './testimonials.css'
import { FaQuoteLeft } from 'react-icons/fa'
<<<<<<< HEAD
import { Autoplay, Navigation } from 'swiper/modules'
=======
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
>>>>>>> 9f05531 (feat(testimonials): redesign layout spacing and replace fake avatars with anonymous project references)
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const Testimonials = () => {
  const { t } = useTranslation();
  const testimonials = t('testimonials.reviews', { returnObjects: true });

  return (
    <section id="testimonials">
      <h5>{t('testimonials.subtitle')}</h5>
      <h2>{t('testimonials.title')}</h2>

      <div className="container testimonials__container">
        <Swiper
          className="testimonials__slider"
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={40}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={true}
        >
          {testimonials.map((testimonial, index) => (
            <SwiperSlide key={index}>
              <div className="testimonial">
                <div className="testimonial__header">
                  <span className="client__badge">{t('testimonials.anonymous_badge')}</span>
                </div>
                <div className="testimonial__body">
                  <div className="testimonial__content">
                    <FaQuoteLeft className="testimonial__icon" />
                    <p className="client__review">{testimonial.review}</p>
                  </div>
                </div>
                <div className="testimonial__footer client__info">
                  <h5 className="client__name">{testimonial.name}</h5>
                  <small className="client__role">{testimonial.role}</small>
                  <small className="client__context">{testimonial.context}</small>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}

export default Testimonials
