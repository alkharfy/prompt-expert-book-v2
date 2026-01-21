'use client'

import { motion } from 'framer-motion'
// import { useEffect, useState } from 'react' - Removed unused hooks
import Image from 'next/image'

interface RobotProps {
    size?: number
    className?: string
    variant?: 'image' | 'video'
    videoSrc?: string
}

export default function Robot({
    size = 400,
    className = '',
    variant = 'image',
    videoSrc
}: RobotProps) {
    // Hover and mouse interaction logic removed as per request


    return (
        <motion.div
            className={`robot-container ${className}`}
            style={{
                width: size,
                height: size,
                maxWidth: '100%',
                aspectRatio: '1/1',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: 1,
                scale: 1,
            }}

        >
            {/* Dynamic Glow Base */}
            <motion.div
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    width: '60%',
                    height: '20px',
                    background: 'radial-gradient(ellipse at center, rgba(255, 107, 53, 0.6) 0%, transparent 70%)',
                    filter: 'blur(10px)',
                    zIndex: 0,
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />

            {/* Robot Image or Video with Floating and Mouse Rotation */}
            <motion.div
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    zIndex: 1,

                }}
                animate={{
                    y: [0, -15, 0],
                }}
                transition={{
                    y: {
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }
                }}
            >
                {variant === 'video' && videoSrc ? (
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                            borderRadius: 'inherit',
                        }}
                    >
                        <video
                            src={videoSrc}
                            poster="/assets/robot-new.png"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                transform: 'scaleX(-1)',
                            }}
                        >
                            <source src={videoSrc} type="video/mp4" />
                            {/* Fallback to Image if video tag isn't supported */}
                            <Image
                                src="/assets/robot-new.png"
                                alt="Robot Mascot Fallback"
                                fill
                                style={{ objectFit: 'contain', transform: 'scaleX(-1)' }}
                                priority
                            />
                        </video>

                        {/* Particles Overlay with Mask */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                zIndex: 2,
                                maskImage: 'radial-gradient(circle at 50% 50%, transparent 45%, black 80%)',
                                WebkitMaskImage: 'radial-gradient(circle at 50% 50%, transparent 45%, black 80%)',
                            }}
                        >
                            {[
                                { top: '10%', left: '15%', delay: 0, dur: 4 },
                                { top: '20%', left: '85%', delay: 1, dur: 5 },
                                { top: '85%', left: '10%', delay: 2, dur: 4.5 },
                                { top: '75%', left: '80%', delay: 0.5, dur: 3.5 },
                                { top: '40%', left: '5%', delay: 1.5, dur: 4 },
                                { top: '50%', left: '95%', delay: 2.5, dur: 5 },
                                { top: '5%', left: '50%', delay: 1.2, dur: 4.2 },
                                { top: '95%', left: '45%', delay: 0.8, dur: 3.8 },
                                { top: '25%', left: '25%', delay: 0.3, dur: 4.8 },
                                { top: '65%', left: '75%', delay: 1.8, dur: 4.3 },
                                { top: '15%', left: '75%', delay: 1.1, dur: 3.9 },
                                { top: '80%', left: '25%', delay: 2.2, dur: 4.7 },
                                { top: '30%', left: '90%', delay: 0.7, dur: 4.1 },
                            ].map((p, i) => (
                                <motion.div
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        top: p.top,
                                        left: p.left,
                                        width: '3px',
                                        height: '3px',
                                        borderRadius: '50%',
                                        background: '#FF6B35',
                                        boxShadow: '0 0 6px #FF6B35',
                                        opacity: 0.6,
                                    }}
                                    animate={{
                                        y: [0, -15, 0],
                                        opacity: [0.4, 0.8, 0.4],
                                    }}
                                    transition={{
                                        duration: p.dur,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: p.delay,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <Image
                        src="/assets/robot-new.png"
                        alt="Robot Mascot"
                        fill
                        style={{ objectFit: 'contain', transform: 'scaleX(-1)' }}
                        priority
                    />
                )}

                {/* Extra Glow overlay on the robot */}
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 50% 50%, rgba(255, 107, 53, 0.1) 0%, transparent 60%)',
                        pointerEvents: 'none',
                    }}
                    animate={{
                        opacity: [0, 0.3, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                    }}
                />
            </motion.div>

        </motion.div>
    )
}
