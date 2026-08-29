import React from 'react'
import { motion, useReducedMotion } from 'motion/react'

const revealTransition = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
}

// El margen inferior positivo adelanta el disparo antes de que el bloque
// cruce el viewport. El HTML sigue visible aunque Motion no llegue a arrancar.
const viewportOptions = {
  once: true,
  amount: 0.05,
  margin: '0px 0px 12% 0px',
}

const itemVariants = {
  hidden: { y: 8 },
  visible: {
    y: 0,
    transition: revealTransition,
  },
}

const groupVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.02,
    },
  },
}

const motionPropNames = new Set([
  'animate',
  'exit',
  'initial',
  'layout',
  'transition',
  'variants',
  'viewport',
  'whileDrag',
  'whileFocus',
  'whileHover',
  'whileInView',
  'whileTap',
])

const getStaticProps = (props) => Object.fromEntries(
  Object.entries(props).filter(([key]) => !motionPropNames.has(key)),
)

const getMotionComponent = (as) => motion[as] || motion.create(as)

const Reveal = ({ as = 'div', delay = 0, className, children, ...props }) => {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return React.createElement(as, {
      ...getStaticProps(props),
      className,
    }, children)
  }

  const MotionComponent = getMotionComponent(as)

  return (
    <MotionComponent
      className={className}
      initial={{ y: 8 }}
      whileInView={{ y: 0 }}
      viewport={viewportOptions}
      transition={{ ...revealTransition, delay: Math.min(Math.max(delay, 0), 0.06) }}
      {...props}
    >
      {children}
    </MotionComponent>
  )
}

export const RevealGroup = ({ as = 'div', className, children, ...props }) => {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return React.createElement(as, {
      ...getStaticProps(props),
      className,
    }, children)
  }

  const MotionComponent = getMotionComponent(as)

  return (
    <MotionComponent
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOptions}
      {...props}
    >
      {children}
    </MotionComponent>
  )
}

export const RevealItem = ({ as = 'div', className, children, ...props }) => {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return React.createElement(as, {
      ...getStaticProps(props),
      className,
    }, children)
  }

  const MotionComponent = getMotionComponent(as)

  return (
    <MotionComponent className={className} variants={itemVariants} {...props}>
      {children}
    </MotionComponent>
  )
}

export default Reveal
