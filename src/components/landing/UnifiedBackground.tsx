'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
    MagicWand,
    DigitalBrain,
    CodeBrackets,
    SmartBulb,
    PenIcon,
    UICardIcon,
    FlowchartIcon,
    SitemapIcon,
    CheckmarkIcon,
    DatabaseIcon
} from '@/components/FloatingAssets'

export default function UnifiedBackground() {
    return (
        <div className="unified-background" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -5,
            pointerEvents: 'none'
        }}>
            {/* Element 1: Magic Wand (Top Left) */}
            <motion.div
                className="floating-asset"
                style={{ position: 'absolute', top: '15%', left: '10%', opacity: 0.6, scale: 1.2 }}
                animate={{
                    y: [0, -30, 0],
                    rotate: [-5, 5, -5],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
                <MagicWand />
            </motion.div>

            {/* Element: Pen (Top Left Area) */}
            <motion.div
                className="floating-asset"
                style={{ position: 'absolute', top: '5%', left: '25%', opacity: 0.7, scale: 1.3 }}
                animate={{
                    y: [0, 20, 0],
                    rotate: [0, 10, 0],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
                <PenIcon />
            </motion.div>

            {/* Element 2: Digital Brain (Bottom Left) */}
            <motion.div
                className="floating-asset"
                style={{ position: 'absolute', bottom: '20%', left: '15%', opacity: 0.6, scale: 1.2 }}
                animate={{
                    y: [0, 25, 0],
                    scale: [1.2, 1.3, 1.2],
                }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            >
                <DigitalBrain />
            </motion.div>

            {/* Element: Flowchart (Bottom Left Area) */}
            <motion.div
                className="floating-asset"
                style={{ position: 'absolute', bottom: '8%', left: '5%', opacity: 0.6, scale: 1.2 }}
                animate={{
                    x: [0, 15, 0],
                    y: [0, -15, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
                <FlowchartIcon />
            </motion.div>

            {/* Element 3: Smart Bulb (Top Right) */}
            <motion.div
                className="floating-asset"
                style={{ position: 'absolute', top: '20%', right: '10%', opacity: 0.6, scale: 1.2 }}
                animate={{
                    y: [0, -40, 0],
                    rotate: [10, -10, 10],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
                <SmartBulb />
            </motion.div>

            {/* Element: Checkmark (Top Right Area) */}
            <motion.div
                className="floating-asset"
                style={{ position: 'absolute', top: '10%', right: '25%', opacity: 0.7, scale: 1.3 }}
                animate={{
                    scale: [1.1, 1.3, 1.1],
                    opacity: [0.6, 0.8, 0.6],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
                <CheckmarkIcon />
            </motion.div>

            {/* Element 4: Code Brackets (Bottom Right) */}
            <motion.div
                className="floating-asset"
                style={{ position: 'absolute', bottom: '15%', right: '15%', opacity: 0.6, scale: 1.2 }}
                animate={{
                    y: [0, 35, 0],
                    rotateX: [0, 20, 0],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <CodeBrackets />
            </motion.div>

            {/* Element: Database (Bottom Right Area) */}
            <motion.div
                className="floating-asset"
                style={{ position: 'absolute', bottom: '5%', right: '30%', opacity: 0.6, scale: 1.2 }}
                animate={{
                    y: [0, -25, 0],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
                <DatabaseIcon />
            </motion.div>

            {/* Element: UI Card (Middle Right Area) */}
            <motion.div
                className="floating-asset"
                style={{ position: 'absolute', top: '45%', right: '12%', opacity: 0.6, scale: 1.4 }}
                animate={{
                    rotateY: [0, 15, 0],
                    y: [0, 30, 0],
                }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            >
                <UICardIcon />
            </motion.div>

            {/* Element: Sitemap (Middle Left Area) */}
            <motion.div
                className="floating-asset"
                style={{ position: 'absolute', top: '55%', left: '12%', opacity: 0.6, scale: 1.2 }}
                animate={{
                    rotate: [-5, 5, -5],
                    scale: [1.2, 1.25, 1.2],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            >
                <SitemapIcon />
            </motion.div>

            {/* Main Image Assets with animations */}
            <motion.div
                style={{ position: 'absolute', top: '15%', left: '5%', width: '200px', height: '200px', opacity: 0.4 }}
                animate={{ y: [0, 30, 0], rotate: [2, -2, 2] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            >
                <Image src="/assets/flow.png" alt="" fill style={{ objectFit: 'contain' }} />
            </motion.div>

            <motion.div
                style={{ position: 'absolute', top: '18%', right: '8%', width: '160px', height: '160px', opacity: 0.5 }}
                animate={{ scale: [1, 1.05, 1], rotate: [-5, 5, -5] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            >
                <Image src="/assets/quality.png" alt="" fill style={{ objectFit: 'contain' }} />
            </motion.div>

            <motion.div
                style={{ position: 'absolute', top: '45%', left: '4%', width: '180px', height: '180px', opacity: 0.3 }}
                animate={{ y: [0, 40, 0], rotate: [10, -10, 10] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            >
                <Image src="/assets/cube.png" alt="" fill style={{ objectFit: 'contain' }} />
            </motion.div>

            <motion.div
                style={{ position: 'absolute', bottom: '10%', right: '5%', width: '200px', height: '200px', opacity: 0.4 }}
                animate={{ rotate: 360, y: [0, -20, 0] }}
                transition={{
                    rotate: { duration: 50, repeat: Infinity, ease: 'linear' },
                    y: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
                }}
            >
                <Image src="/assets/gear.png" alt="" fill style={{ objectFit: 'contain' }} />
            </motion.div>
        </div>
    )
}
