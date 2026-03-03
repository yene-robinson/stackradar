;; title: portfolio-tracker
;; version: 1.0.0
;; summary: StackRadar Portfolio Tracker - Track sBTC positions and DeFi allocations
;; description: A smart contract for tracking user sBTC holdings, positions across
;; DeFi protocols, and historical portfolio data on the Stacks blockchain.

;; ============================================
;; TRAITS
;; ============================================

;; SIP-010 Fungible Token Trait for sBTC integration
;; Note: In production deployment, uncomment and use mainnet trait address
;; (use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ============================================
;; CONSTANTS
;; ============================================

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-POSITION-NOT-FOUND (err u1001))
(define-constant ERR-INVALID-AMOUNT (err u1002))
(define-constant ERR-PROTOCOL-NOT-REGISTERED (err u1003))
(define-constant ERR-ALREADY-REGISTERED (err u1004))
(define-constant ERR-INVALID-PROTOCOL (err u1005))
(define-constant ERR-OVERFLOW (err u1006))

;; Contract owner
(define-constant CONTRACT-OWNER tx-sender)

;; Position types
(define-constant POSITION-TYPE-HOLD u1)
(define-constant POSITION-TYPE-STAKED u2)
(define-constant POSITION-TYPE-LENDING u3)
(define-constant POSITION-TYPE-LP u4)

;; ============================================
;; DATA VARIABLES
;; ============================================

;; Total registered users
(define-data-var total-users uint u0)

;; Total tracked value (in micro-sBTC, 8 decimals)
(define-data-var total-tracked-value uint u0)

;; Protocol counter
(define-data-var protocol-counter uint u0)

;; ============================================
;; DATA MAPS
;; ============================================

;; User registration and aggregate data
(define-map users
  principal
  {
    registered-at: uint,
    total-positions: uint,
    total-value: uint,
    last-updated: uint
  }
)

;; Individual positions for each user
(define-map positions
  { user: principal, position-id: uint }
  {
    protocol-id: uint,
    position-type: uint,
    amount: uint,
    entry-value: uint,
    entry-block: uint,
    last-updated: uint,
    is-active: bool
  }
)

;; User position counter
(define-map user-position-counter
  principal
  uint
)

;; Registered DeFi protocols
(define-map protocols
  uint
  {
    name: (string-ascii 64),
    contract-address: principal,
    is-active: bool,
    total-tracked: uint,
    registered-at: uint
  }
)

;; Protocol name to ID mapping
(define-map protocol-name-to-id
  (string-ascii 64)
  uint
)

;; Historical snapshots for users (for yield calculation)
(define-map portfolio-snapshots
  { user: principal, stacks-block-height: uint }
  {
    total-value: uint,
    position-count: uint,
    timestamp: uint
  }
)

;; ============================================
;; AUTHORIZATION HELPERS
;; ============================================

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

;; ============================================
;; PUBLIC FUNCTIONS - User Management
;; ============================================

;; Register a new user
(define-public (register-user)
  (let
    (
      (existing-user (map-get? users tx-sender))
    )
    (asserts! (is-none existing-user) ERR-ALREADY-REGISTERED)
    (map-set users tx-sender
      {
        registered-at: stacks-block-height,
        total-positions: u0,
        total-value: u0,
        last-updated: stacks-block-height
      }
    )
    (map-set user-position-counter tx-sender u0)
    (var-set total-users (+ (var-get total-users) u1))
    (ok true)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - Position Management
;; ============================================

;; Add a new position
(define-public (add-position 
    (protocol-id uint)
    (position-type uint)
    (amount uint)
    (entry-value uint)
  )
  (let
    (
      (user-data (unwrap! (map-get? users tx-sender) ERR-NOT-AUTHORIZED))
      (protocol (unwrap! (map-get? protocols protocol-id) ERR-PROTOCOL-NOT-REGISTERED))
      (current-position-count (default-to u0 (map-get? user-position-counter tx-sender)))
      (new-position-id (+ current-position-count u1))
      (new-total-value (+ (get total-value user-data) entry-value))
    )
    ;; Validate inputs
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (get is-active protocol) ERR-INVALID-PROTOCOL)
    (asserts! (or (is-eq position-type POSITION-TYPE-HOLD)
                  (is-eq position-type POSITION-TYPE-STAKED)
                  (is-eq position-type POSITION-TYPE-LENDING)
                  (is-eq position-type POSITION-TYPE-LP)) ERR-INVALID-AMOUNT)
    
    ;; Create position
    (map-set positions
      { user: tx-sender, position-id: new-position-id }
      {
        protocol-id: protocol-id,
        position-type: position-type,
        amount: amount,
        entry-value: entry-value,
        entry-block: stacks-block-height,
        last-updated: stacks-block-height,
        is-active: true
      }
    )
    
    ;; Update user data
    (map-set users tx-sender
      (merge user-data {
        total-positions: new-position-id,
        total-value: new-total-value,
        last-updated: stacks-block-height
      })
    )
    
    ;; Update position counter
    (map-set user-position-counter tx-sender new-position-id)
    
    ;; Update global tracked value
    (var-set total-tracked-value (+ (var-get total-tracked-value) entry-value))
    
    ;; Update protocol total
    (map-set protocols protocol-id
      (merge protocol {
        total-tracked: (+ (get total-tracked protocol) entry-value)
      })
    )
    
    (ok new-position-id)
  )
)

;; Update position value (for rebalancing/yield updates)
(define-public (update-position-value
    (position-id uint)
    (new-amount uint)
    (new-value uint)
  )
  (let
    (
      (position (unwrap! (map-get? positions { user: tx-sender, position-id: position-id }) ERR-POSITION-NOT-FOUND))
      (user-data (unwrap! (map-get? users tx-sender) ERR-NOT-AUTHORIZED))
      (old-value (get entry-value position))
      (value-diff (if (> new-value old-value) 
                      (- new-value old-value) 
                      u0))
      (value-decrease (if (< new-value old-value)
                          (- old-value new-value)
                          u0))
    )
    (asserts! (get is-active position) ERR-POSITION-NOT-FOUND)
    (asserts! (> new-amount u0) ERR-INVALID-AMOUNT)
    
    ;; Update position
    (map-set positions
      { user: tx-sender, position-id: position-id }
      (merge position {
        amount: new-amount,
        entry-value: new-value,
        last-updated: stacks-block-height
      })
    )
    
    ;; Update user total value
    (map-set users tx-sender
      (merge user-data {
        total-value: (+ (- (get total-value user-data) old-value) new-value),
        last-updated: stacks-block-height
      })
    )
    
    ;; Update global tracked value
    (var-set total-tracked-value 
      (+ (- (var-get total-tracked-value) old-value) new-value))
    
    (ok true)
  )
)

;; Close/remove a position
(define-public (close-position (position-id uint))
  (let
    (
      (position (unwrap! (map-get? positions { user: tx-sender, position-id: position-id }) ERR-POSITION-NOT-FOUND))
      (user-data (unwrap! (map-get? users tx-sender) ERR-NOT-AUTHORIZED))
      (protocol (unwrap! (map-get? protocols (get protocol-id position)) ERR-PROTOCOL-NOT-REGISTERED))
      (position-value (get entry-value position))
    )
    (asserts! (get is-active position) ERR-POSITION-NOT-FOUND)
    
    ;; Mark position as inactive
    (map-set positions
      { user: tx-sender, position-id: position-id }
      (merge position {
        is-active: false,
        last-updated: stacks-block-height
      })
    )
    
    ;; Update user data
    (map-set users tx-sender
      (merge user-data {
        total-value: (- (get total-value user-data) position-value),
        last-updated: stacks-block-height
      })
    )
    
    ;; Update global tracked value
    (var-set total-tracked-value (- (var-get total-tracked-value) position-value))
    
    ;; Update protocol total
    (map-set protocols (get protocol-id position)
      (merge protocol {
        total-tracked: (- (get total-tracked protocol) position-value)
      })
    )
    
    (ok true)
  )
)

;; Take a portfolio snapshot (for historical tracking)
(define-public (take-snapshot)
  (let
    (
      (user-data (unwrap! (map-get? users tx-sender) ERR-NOT-AUTHORIZED))
    )
    (map-set portfolio-snapshots
      { user: tx-sender, stacks-block-height: stacks-block-height }
      {
        total-value: (get total-value user-data),
        position-count: (get total-positions user-data),
        timestamp: stacks-block-height
      }
    )
    (ok stacks-block-height)
  )
)