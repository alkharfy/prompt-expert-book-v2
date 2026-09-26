import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

export default [
    ...nextCoreWebVitals,
    {
        files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
        rules: {
            // Allow setState in effects — common pattern for loading data from APIs/localStorage
            'react-hooks/set-state-in-effect': 'warn',
        },
    },
]
