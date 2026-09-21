export async function parseJsonSafe(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  // If content-type indicates JSON, attempt to parse
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (e) {
      // Parsing failed despite JSON content-type
      throw new Error('Failed to parse JSON response');
    }
  }

  // For other content-types, attempt a safe parse but avoid throwing raw HTML into JSON.parse
  const text = await response.text();
  // Quick check: if it looks like HTML, return a helpful error
  if (text.trim().startsWith('<')) {
    throw new Error('Server returned HTML instead of JSON');
  }

  // Try to parse as JSON as a last resort
  try {
    return JSON.parse(text || '{}');
  } catch (e) {
    throw new Error('Response is not valid JSON');
  }
}
