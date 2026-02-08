# Testing Guide

**Project:** HealUI Clinic Web
**Status:** Testing Infrastructure Ready
**Last Updated:** Phase 7 - Polish & Best Practices

---

## 🎯 Testing Philosophy

1. **Test behavior, not implementation**
2. **Focus on user interactions**
3. **Test critical paths first**
4. **Keep tests simple and readable**
5. **Maintain fast test suite**

---

## 📋 Test Structure

### Recommended Test Organization

```
src/components/features/patients/
├── AddPatientModal.tsx
├── AddPatientModal.test.tsx          # Co-located unit tests
├── EditPatientModal.tsx
├── EditPatientModal.test.tsx
└── __tests__/                         # Alternative: folder-based
    ├── AddPatientModal.test.tsx
    └── integration/
        └── PatientWorkflow.test.tsx
```

**Choose one:**
- ✅ **Co-located** (Recommended): Tests next to components
- ✅ **Folder-based**: Tests in `__tests__/` folders

---

## 🛠️ Testing Tools (To Install)

### 1. **Jest** - Test Runner
```bash
npm install --save-dev jest @types/jest jest-environment-jsdom
```

### 2. **React Testing Library** - Component Testing
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 3. **Playwright** - E2E Testing
```bash
npm install --save-dev @playwright/test
```

---

## 📝 Test Types

### 1. Unit Tests

**What:** Test individual functions/components in isolation

**Example:**
```typescript
// src/lib/utils/helpers.test.ts
import { formatPhoneNumber } from './helpers';

describe('formatPhoneNumber', () => {
  it('formats Indian phone number correctly', () => {
    expect(formatPhoneNumber('9876543210')).toBe('+91 98765 43210');
  });

  it('handles invalid input', () => {
    expect(formatPhoneNumber('')).toBe('');
    expect(formatPhoneNumber('123')).toBe('123');
  });
});
```

### 2. Component Tests

**What:** Test React components with user interactions

**Example:**
```typescript
// src/components/features/patients/AddPatientModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddPatientModal from './AddPatientModal';

describe('AddPatientModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(
      <AddPatientModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Add New Patient')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <AddPatientModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByText('Save');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <AddPatientModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Phone'), '9876543210');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');

    const submitButton = screen.getByText('Save');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        full_name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
      });
    });
  });

  it('closes modal on cancel', async () => {
    const user = userEvent.setup();

    render(
      <AddPatientModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

### 3. Integration Tests

**What:** Test multiple components working together

**Example:**
```typescript
// src/components/features/patients/__tests__/integration/PatientWorkflow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PatientsPage from '@/app/dashboard/patients/page';

describe('Patient Management Workflow', () => {
  it('allows adding and viewing a patient', async () => {
    const user = userEvent.setup();
    const store = configureStore({ /* ... */ });

    render(
      <Provider store={store}>
        <PatientsPage />
      </Provider>
    );

    // Open add patient modal
    const addButton = screen.getByText('Add Patient');
    await user.click(addButton);

    // Fill form
    await user.type(screen.getByLabelText('Full Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Phone'), '9123456789');

    // Submit
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    // Verify patient appears in list
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('9123456789')).toBeInTheDocument();
    });
  });
});
```

### 4. E2E Tests (Playwright)

**What:** Test complete user flows in a real browser

**Example:**
```typescript
// e2e/patient-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="phone"]', '9876543210');
    await page.fill('[name="otp"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should add a new patient', async ({ page }) => {
    // Navigate to patients
    await page.click('text=Patients');
    await expect(page).toHaveURL(/\/dashboard\/patients/);

    // Click add patient
    await page.click('text=Add Patient');

    // Fill form
    await page.fill('[name="full_name"]', 'Test Patient');
    await page.fill('[name="phone"]', '9998887776');
    await page.fill('[name="email"]', 'test@example.com');

    // Submit
    await page.click('button:has-text("Save")');

    // Verify success
    await expect(page.locator('text=Test Patient')).toBeVisible();
  });

  test('should view patient details', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/patients');

    // Click on a patient
    await page.click('text=Test Patient');

    // Verify modal/page opens
    await expect(page.locator('text=Patient Details')).toBeVisible();
    await expect(page.locator('text=9998887776')).toBeVisible();
  });
});
```

---

## 🧪 Testing Configuration

### Jest Configuration (`jest.config.js`)

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Path to Next.js app
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

### Jest Setup (`jest.setup.js`)

```javascript
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 📊 Testing Priorities

### High Priority (Test First)

1. **Authentication Flow**
   - Login/logout
   - OTP verification
   - Session management

2. **Patient Management**
   - Add/edit/delete patients
   - Patient search
   - Patient details

3. **Appointment Booking**
   - Schedule appointment
   - Reschedule
   - Cancel

4. **Billing**
   - Create bill
   - Record payment
   - Session packs

5. **Critical Paths**
   - Dashboard load
   - Data persistence
   - Error handling

### Medium Priority

6. **Condition Management**
7. **Clinical Assessments**
8. **Treatment Protocols**
9. **Team Management**
10. **Profile Settings**

### Low Priority

11. **UI Component Library**
12. **Utility Functions**
13. **Edge Cases**

---

## 🎯 Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Critical Paths | 90%+ |
| Business Logic | 80%+ |
| Components | 70%+ |
| Utilities | 80%+ |
| Overall | 75%+ |

### Check Coverage

```bash
npm test -- --coverage
```

---

## 🚀 Running Tests

### Unit & Component Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Run specific test file
npm test -- AddPatientModal.test.tsx

# Run tests for a feature
npm test -- patients/

# Coverage report
npm test -- --coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e -- patient-management

# Debug mode
npm run test:e2e -- --debug
```

---

## 💡 Testing Best Practices

### Do's ✅

1. **Test user behavior, not implementation**
   ```typescript
   // ✅ Good
   expect(screen.getByText('Patient added successfully')).toBeInTheDocument();

   // ❌ Bad
   expect(component.state.patients.length).toBe(1);
   ```

2. **Use semantic queries**
   ```typescript
   // ✅ Good
   screen.getByRole('button', { name: 'Save' })
   screen.getByLabelText('Full Name')

   // ❌ Bad
   screen.getByTestId('save-btn')
   screen.getByClassName('input-field')
   ```

3. **Test accessibility**
   ```typescript
   expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
   expect(screen.getByRole('button')).toHaveAccessibleName('Save');
   ```

4. **Mock external dependencies**
   ```typescript
   jest.mock('@/services/api/api.service', () => ({
     createPatient: jest.fn(),
   }));
   ```

5. **Clean up after tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

### Don'ts ❌

1. **Don't test implementation details**
2. **Don't make tests dependent on each other**
3. **Don't use arbitrary waits** (`setTimeout`)
4. **Don't test external libraries**
5. **Don't skip test isolation**

---

## 📚 Resources

- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🔄 CI/CD Integration (Future)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run test:e2e
```

---

**Maintained by:** Development Team
**Status:** Infrastructure ready, tests to be added
