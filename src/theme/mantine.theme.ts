import { MantineThemeOverride } from '@mantine/core';

export const neuroFlowTheme: MantineThemeOverride = {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    colorScheme: 'light',
    primaryColor: 'neural-blue',
    colors: {
        'neural-blue': ['#E6F0FF', '#B3D1FF', '#80B3FF', '#4D94FF', '#1A75FF', '#0066FF', '#0052CC', '#003D99', '#002966', '#001433'],
        'agent-purple': ['#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95'],
    },
    fontFamily: 'Inter var, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    headings: {
        fontFamily: 'Cal Sans, Inter var, sans-serif',
        sizes: {
            h1: { fontSize: 'clamp(2rem, 4vw, 3rem)' },
            h2: { fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' },
        },
    },
    other: {
        transitions: {
            spring: 'all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            smooth: 'all 300ms cubic-bezier(0.23, 1, 0.320, 1)',
        },
    },
    components: {
        Button: {
            defaultProps: {
                radius: 'md',
            },
            styles: (theme: any) => ({
                root: {
                    transition: theme.other.transitions.spring,
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows.md,
                    },
                },
            }),
        },
        Card: {
            defaultProps: {
                radius: 'lg',
                withBorder: true,
            },
            styles: (theme: any) => ({
                root: {
                    backdropFilter: 'blur(40px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                },
            }),
        },
    },
};