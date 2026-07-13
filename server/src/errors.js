// Thrown by access-management helpers (member/staff account creation and
// resets) for expected, user-facing failures — routes map these to the
// right HTTP status instead of a generic 500.
export class AccessError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
