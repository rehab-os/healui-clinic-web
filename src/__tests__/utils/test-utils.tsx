import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

// Add any providers your app needs (Redux, Theme, etc.)
interface AllTheProvidersProps {
  children: ReactNode
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <>
      {/* Add your providers here, for example: */}
      {/* <ReduxProvider store={store}> */}
      {/*   <ThemeProvider> */}
      {children}
      {/*   </ThemeProvider> */}
      {/* </ReduxProvider> */}
    </>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render method
export { customRender as render }
