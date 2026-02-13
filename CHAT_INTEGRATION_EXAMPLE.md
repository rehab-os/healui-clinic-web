# Chat Widget Integration Example

## Quick Start

### 1. Add Environment Variable

Create `.env.local` in `healui-clinic-web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
```

### 2. Use in Any Page

```typescript
// app/page.tsx (or any page)
import { ChatWidget } from '@/components/chat';

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to HealUI Clinic</h1>

      {/* Your existing content */}

      {/* Add Chat Widget - Fixed position, always visible */}
      <ChatWidget
        clinicId="your-clinic-id-here"
        onComplete={(patientId) => {
          console.log('✅ Patient registered:', patientId);
          // Optional: Redirect to thank you page
          // router.push(`/confirmation?patientId=${patientId}`);
        }}
      />
    </div>
  );
}
```

### 3. Or Use in a Specific Route

```typescript
// app/register/page.tsx
'use client';

import { ChatWidget } from '@/components/chat';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-3xl font-bold">Patient Registration</h1>
        <p className="mb-8 text-gray-600">
          Click the chat button to get started with our AI assistant!
        </p>

        <ChatWidget
          clinicId={process.env.NEXT_PUBLIC_CLINIC_ID || 'default-clinic'}
          onComplete={(patientId) => {
            // Redirect to confirmation page
            router.push(`/confirmation?patient=${patientId}`);
          }}
        />
      </div>
    </div>
  );
}
```

### 4. Advanced: Custom Styling

```typescript
import { ChatWidget } from '@/components/chat';

export default function Page() {
  return (
    <ChatWidget
      clinicId="clinic-123"
      className="custom-chat-widget" // Add custom classes
      onComplete={(patientId) => {
        // Show success toast
        toast.success('Registration complete!');

        // Track analytics
        analytics.track('patient_registered', { patientId });

        // Update state
        setRegistered(true);
      }}
    />
  );
}
```

### 5. Conditional Rendering

```typescript
'use client';

import { ChatWidget } from '@/components/chat';
import { useState } from 'react';

export default function Page() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChat(true)}>
        Start Registration
      </button>

      {showChat && (
        <ChatWidget
          clinicId="clinic-123"
          onComplete={(patientId) => {
            setShowChat(false);
            alert('Registration complete!');
          }}
        />
      )}
    </div>
  );
}
```

## Testing

### Without OpenAI API Key (Fallback Mode)
- Widget will work with mock responses
- Shows warning in replies
- Perfect for UI testing

### With OpenAI API Key
1. Add to `healui-backend-core/.env`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```
2. Restart backend
3. Chat will use real AI responses

## Customization

### Change Chat Position

Edit `ChatToggle.tsx` and `ChatPanel.tsx`:

```typescript
// Bottom-left instead of bottom-right
className="fixed bottom-6 left-6 z-50 ..."

// Top-right
className="fixed top-6 right-6 z-50 ..."
```

### Change Colors

Edit components to match your brand:

```typescript
// Primary color (blue)
bg-blue-600 → bg-purple-600

// Gradients
from-blue-600 to-blue-700 → from-purple-600 to-purple-700
```

### Custom Clinic Name

Update `chat.service.ts`:

```typescript
const agentResponse = await this.agent.processMessage(
  dto.message,
  dto.conversationHistory,
  dto.currentStep,
  'Your Clinic Name Here', // Change this
);
```

Or fetch from database:
```typescript
const clinic = await this.clinicsService.findById(dto.clinicId);
const agentResponse = await this.agent.processMessage(
  dto.message,
  dto.conversationHistory,
  dto.currentStep,
  clinic.name,
);
```

## Troubleshooting

### Chat not appearing?
- Check that backend is running on port 3002
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for errors

### Fallback mode warning?
- Add `OPENAI_API_KEY` to backend `.env`
- Restart backend server

### CORS errors?
- Backend CORS is already configured for all origins
- If issues, check `main.ts` CORS settings

## Production Deployment

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=your-production-db
OPENAI_API_KEY=sk-your-key
JWT_SECRET=your-secret
NODE_ENV=production
PORT=3002
```

**Frontend (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_CLINIC_ID=your-clinic-id
```

### Performance Tips

1. **Enable caching** for common responses
2. **Use React.memo** for chat components
3. **Lazy load** the chat widget:
   ```typescript
   const ChatWidget = dynamic(() => import('@/components/chat'), {
     ssr: false,
   });
   ```

4. **Monitor OpenAI usage** to control costs

## Analytics Integration

```typescript
<ChatWidget
  clinicId="clinic-123"
  onComplete={(patientId) => {
    // Google Analytics
    gtag('event', 'patient_registered', {
      patient_id: patientId,
    });

    // Custom analytics
    analytics.track('intake_completed', {
      patientId,
      timestamp: new Date(),
    });
  }}
/>
```

## Support

For issues or questions:
1. Check backend logs
2. Check browser console
3. Test API endpoints with curl
4. Review this documentation

Happy coding! 🚀
