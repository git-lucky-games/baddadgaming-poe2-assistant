// Translates the API errors thrown by GggApiClient/TradeApiClient/PoeNinjaClient
// into copy a busy-dad user can act on, instead of a raw HTTP status. Duck-typed
// on the shared {status: number} shape all three error classes have, so this
// doesn't need to import or couple to any of them specifically.

interface ApiErrorLike {
  status: number
}

function isApiErrorLike(err: unknown): err is ApiErrorLike {
  return typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status: unknown }).status === 'number'
}

export function friendlyErrorMessage(err: unknown, source: string): string {
  if (isApiErrorLike(err)) {
    const { status } = err
    if (status === 401 || status === 403) {
      return `Couldn't access your account on ${source} — your POESESSID may have expired, or your profile's privacy setting might be blocking this. Grab a fresh POESESSID from your browser and check your profile privacy on pathofexile.com, then try again.`
    }
    if (status === 429) {
      return `${source} is rate-limiting requests right now — this usually clears up within a minute or two. Try again shortly.`
    }
    if (status >= 500) {
      return `${source} is having issues right now — try again in a bit.`
    }
    if (status === 404) {
      return `Couldn't find that on ${source} — double-check your account name and character in Settings.`
    }
    return `Something went wrong talking to ${source} (status ${status}). Try again, and check Settings if it keeps happening.`
  }
  return err instanceof Error ? err.message : String(err)
}
