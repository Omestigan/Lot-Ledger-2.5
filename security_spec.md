# Firebase Security Specification - Lot & Ledger v2.0 Network

## 1. Data Invariants

1. **Users (`/users/{userId}`)**:
   - `uid` must strictly match `request.auth.uid`.
   - Users can only modify their own profile.
   - PII (email) is restricted to the authenticated document owner.

2. **Save Slots (`/save_slots/{slotId}`)**:
   - `userId` must match `request.auth.uid`.
   - Only the slot owner can create, update, or delete their save slot.
   - `slotId` follows pattern `{userId}_{slotNumber}` or UUID.

3. **B2B Wholesale Offers (`/b2b_offers/{offerId}`)**:
   - `sellerId` must match `request.auth.uid` on creation.
   - Anyone authenticated can view active offers (`status == 'active'` or `sellerId == request.auth.uid` or `buyerId == request.auth.uid`).
   - Only the seller can cancel an offer (`status` -> `'cancelled'`).
   - Authenticated buyers can purchase an offer (`status` -> `'sold'`, `buyerId` -> `request.auth.uid`).

4. **Live Chat (`/chat_messages/{messageId}`)**:
   - `senderId` must match `request.auth.uid`.
   - Authenticated users can read messages.
   - Messages are immutable once created.

---

## 2. The Dirty Dozen Security Test Payloads

1. **Identity Spoofing in Profile Creation**:
   Attempting to write `/users/target_user_999` with `request.auth.uid = attacker_123`.
   - Expected Result: `PERMISSION_DENIED`

2. **Unauthenticated Profile Read of PII**:
   Attempting to fetch `/users/target_user_999` while unauthenticated.
   - Expected Result: `PERMISSION_DENIED`

3. **Save Slot Hijacking**:
   Attempting to update `/save_slots/user_victim_1` with `request.auth.uid = user_attacker_2`.
   - Expected Result: `PERMISSION_DENIED`

4. **Over-sized Game State Injection**:
   Attempting to write a save slot with a `gameState` string exceeding 500,000 characters.
   - Expected Result: `PERMISSION_DENIED`

5. **B2B Seller Spoofing**:
   Creating a B2B offer with `sellerId = victim_dealer` while logged in as `attacker_dealer`.
   - Expected Result: `PERMISSION_DENIED`

6. **B2B Price Tampering on Purchase**:
   Attempting to update `askingPrice` from $50,000 to $1 while marking status as `'sold'`.
   - Expected Result: `PERMISSION_DENIED` (affectedKeys must only allow `status` and `buyerId` and `updatedAt`).

7. **B2B Offer Modification by Non-Seller/Non-Buyer**:
   Third party updating someone else's B2B offer.
   - Expected Result: `PERMISSION_DENIED`

8. **Chat Sender Impersonation**:
   Posting a chat message with `senderId = auto_tycoon_owner` while `request.auth.uid = malicious_user`.
   - Expected Result: `PERMISSION_DENIED`

9. **Chat Message Alteration**:
   Attempting to edit or delete an existing chat message.
   - Expected Result: `PERMISSION_DENIED`

10. **Malicious Document ID Injections**:
    Attempting to create documents with unsafe characters like `../` or exceeding 128 characters in length.
    - Expected Result: `PERMISSION_DENIED`

11. **Negative Price/Cash Injection**:
    Submitting B2B asking price or save slot cash with negative values.
    - Expected Result: `PERMISSION_DENIED`

12. **System Root Access Attempt**:
    Attempting to write to `/admin` or arbitrary document collections outside defined match blocks.
    - Expected Result: `PERMISSION_DENIED`
