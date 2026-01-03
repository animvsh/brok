# Generate Course Edge Function

This Supabase Edge Function generates comprehensive beginner-friendly courses using OpenAI and stores them in your Supabase database.

## Features

- ✅ Uses OpenAI API key from Supabase secrets
- ✅ Generates 8-12 comprehensive modules covering all aspects of a topic
- ✅ Creates 4-6 concepts per module with 3-5 questions each
- ✅ Beginner-friendly, assumes zero prior knowledge
- ✅ Automatically stores course in Supabase database
- ✅ Sets up user progress tracking if user_id provided

## Deployment

### Prerequisites

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref iqqkdhifygfrqpxedtgk
   ```

### Set Up Secrets

The function needs the OpenAI API key stored in Supabase secrets:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

The function automatically has access to:
- `SUPABASE_URL` (automatically provided)
- `SUPABASE_SERVICE_ROLE_KEY` (automatically provided)

### Deploy the Function

From the project root:

```bash
supabase functions deploy generate-course
```

Or from the function directory:

```bash
cd supabase/functions/generate-course
supabase functions deploy generate-course
```

## Usage

### API Endpoint

Once deployed, call the function at:
```
https://iqqkdhifygfrqpxedtgk.supabase.co/functions/v1/generate-course
```

### Request Format

**POST** request with JSON body:

```json
{
  "topic": "JavaScript",
  "user_id": "optional-user-uuid"
}
```

### Example with cURL

```bash
curl -X POST \
  'https://iqqkdhifygfrqpxedtgk.supabase.co/functions/v1/generate-course' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "topic": "Python Programming",
    "user_id": "user-uuid-here"
  }'
```

### Example with JavaScript/TypeScript

```typescript
const { data, error } = await supabase.functions.invoke('generate-course', {
  body: {
    topic: 'Machine Learning',
    user_id: user.id // optional
  }
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('Course created:', data);
}
```

### Response Format

```json
{
  "success": true,
  "course": {
    "id": "course-uuid",
    "title": "Complete Course Title",
    "description": "Course description",
    "goal": "Learning goal",
    "total_modules": 10
  },
  "modules": 10,
  "concepts": 45
}
```

## Course Structure

The function generates:

- **8-12 Modules**: Comprehensive coverage from beginner to intermediate
- **4-6 Concepts per Module**: Small, digestible learning units
- **3-5 Questions per Concept**: Educational questions that teach through options
- **Progressive Difficulty**: Starts with fundamentals, builds complexity

### Question Types

- `multiple_choice`: 4 options, one correct answer
- `true_false`: True/False questions
- `fill_blank`: Fill-in-the-blank questions (use `___` for blank)

## Database Schema

The function creates records in:

1. **courses** table: Main course record
2. **modules** table: Course modules with order
3. **concepts** table: Learning concepts with questions (stored as JSONB)
4. **user_performance** table: Initialized if user_id provided
5. **user_progress** table: Set as active course if user_id provided

## Error Handling

The function returns appropriate HTTP status codes:

- `200`: Success
- `400`: Invalid input (topic too short, missing topic)
- `500`: Server error (OpenAI API error, database error, missing secrets)

## Testing Locally

You can test the function locally:

```bash
supabase functions serve generate-course
```

Then call it at `http://localhost:54321/functions/v1/generate-course`

## Monitoring

Check function logs:

```bash
supabase functions logs generate-course
```

Or view in Supabase Dashboard:
- Go to Edge Functions → generate-course → Logs

## Cost Considerations

- Uses GPT-4o model (more expensive but better quality)
- Generates 8-12 modules with multiple concepts each
- Estimated cost: ~$0.10-0.30 per course generation
- Consider rate limiting in your application

## Customization

To modify the course generation:

1. Edit the prompt in `generateComprehensiveCourse()` function
2. Adjust module/concept/question limits
3. Change OpenAI model (currently `gpt-4o`)
4. Redeploy: `supabase functions deploy generate-course`



