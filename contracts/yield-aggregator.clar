;; title: yield-aggregator
;; version: 1.0.0
;; summary: StackRadar Yield Aggregator - Track and aggregate sBTC yield across DeFi protocols
;; description: A smart contract for tracking yield rates, calculating APY/APR,
;; recording yield history, and aggregating data from various DeFi protocols.

;; ============================================
;; CONSTANTS
;; ============================================

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u2000))
(define-constant ERR-SOURCE-NOT-FOUND (err u2001))
(define-constant ERR-INVALID-RATE (err u2002))
(define-constant ERR-ALREADY-EXISTS (err u2003))
(define-constant ERR-SOURCE-INACTIVE (err u2004))
(define-constant ERR-NO-DATA (err u2005))
(define-constant ERR-INVALID-PERIOD (err u2006))
(define-constant ERR-USER-NOT-FOUND (err u2007))
(define-constant ERR-OVERFLOW (err u2008))

;; Contract owner
(define-constant CONTRACT-OWNER tx-sender)

;; Precision for rate calculations (6 decimals = 1000000 = 100%)
(define-constant RATE-PRECISION u1000000)

;; Blocks per year (approximately, for APY calculations)
;; ~144 blocks/day * 365 days = 52,560 blocks/year on Stacks
(define-constant BLOCKS-PER-YEAR u52560)

;; Yield source types
(define-constant SOURCE-TYPE-STAKING u1)
(define-constant SOURCE-TYPE-LENDING u2)
(define-constant SOURCE-TYPE-LP u3)
(define-constant SOURCE-TYPE-VAULT u4)

;; ============================================
;; DATA VARIABLES
;; ============================================

;; Total yield sources
(define-data-var total-sources uint u0)

;; Total yield distributed (tracked)
(define-data-var total-yield-distributed uint u0)

;; Oracle/updater address (can be changed by owner)
(define-data-var rate-oracle principal CONTRACT-OWNER)

;; ============================================
;; DATA MAPS
;; ============================================

;; Yield sources (protocols that generate yield)
(define-map yield-sources
  uint  ;; source-id
  {
    name: (string-ascii 64),
    source-type: uint,
    contract-address: principal,
    current-apy: uint,              ;; APY in basis points (10000 = 100%)
    min-deposit: uint,
    tvl: uint,                      ;; Total value locked
    is-active: bool,
    last-updated: uint,
    created-at: uint
  }
)

;; Source name to ID mapping
(define-map source-name-to-id
  (string-ascii 64)
  uint
)

;; Historical APY rates for each source
(define-map apy-history
  { source-id: uint, snapshot-block: uint }
  {
    apy: uint,
    tvl: uint,
    timestamp: uint
  }
)

;; User yield tracking
(define-map user-yield-tracking
  { user: principal, source-id: uint }
  {
    principal-amount: uint,
    accumulated-yield: uint,
    last-claim-block: uint,
    entry-block: uint,
    entry-apy: uint
  }
)

;; User total yield earned (aggregate)
(define-map user-total-yield
  principal
  {
    total-earned: uint,
    total-claimed: uint,
    sources-count: uint,
    last-updated: uint
  }
)

;; Daily/periodic yield snapshots for analytics
(define-map yield-snapshots
  { source-id: uint, period: uint }  ;; period = stacks-block-height / BLOCKS-PER-DAY
  {
    avg-apy: uint,
    total-yield: uint,
    unique-users: uint
  }
)

;; ============================================
;; AUTHORIZATION HELPERS
;; ============================================

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (is-oracle)
  (is-eq tx-sender (var-get rate-oracle))
)

(define-private (is-authorized-updater)
  (or (is-contract-owner) (is-oracle))
)

;; ============================================
;; PUBLIC FUNCTIONS - Source Management
;; ============================================

;; Register a new yield source
(define-public (register-yield-source
    (name (string-ascii 64))
    (source-type uint)
    (contract-address principal)
    (initial-apy uint)
    (min-deposit uint)
  )
  (let
    (
      (new-id (+ (var-get total-sources) u1))
      (existing (map-get? source-name-to-id name))
      (current-block stacks-block-height)
    )
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (asserts! (is-none existing) ERR-ALREADY-EXISTS)
    (asserts! (<= initial-apy u10000000) ERR-INVALID-RATE) ;; Max 1000% APY
    (asserts! (or (is-eq source-type SOURCE-TYPE-STAKING)
                  (is-eq source-type SOURCE-TYPE-LENDING)
                  (is-eq source-type SOURCE-TYPE-LP)
                  (is-eq source-type SOURCE-TYPE-VAULT)) ERR-INVALID-RATE)
    
    (map-set yield-sources new-id
      {
        name: name,
        source-type: source-type,
        contract-address: contract-address,
        current-apy: initial-apy,
        min-deposit: min-deposit,
        tvl: u0,
        is-active: true,
        last-updated: current-block,
        created-at: current-block
      }
    )
    
    (map-set source-name-to-id name new-id)
    
    ;; Record initial APY in history
    (map-set apy-history
      { source-id: new-id, snapshot-block: current-block }
      {
        apy: initial-apy,
        tvl: u0,
        timestamp: current-block
      }
    )
    
    (var-set total-sources new-id)
    (ok new-id)
  )
)

;; Update APY rate for a source (oracle function)
(define-public (update-apy (source-id uint) (new-apy uint))
  (let
    (
      (source (unwrap! (map-get? yield-sources source-id) ERR-SOURCE-NOT-FOUND))
    )
    (asserts! (is-authorized-updater) ERR-NOT-AUTHORIZED)
    (asserts! (get is-active source) ERR-SOURCE-INACTIVE)
    (asserts! (<= new-apy u10000000) ERR-INVALID-RATE)
    
    ;; Update source
    (map-set yield-sources source-id
      (merge source {
        current-apy: new-apy,
        last-updated: stacks-block-height
      })
    )
    
    ;; Record in history
    (map-set apy-history
      { source-id: source-id, snapshot-block: stacks-block-height }
      {
        apy: new-apy,
        tvl: (get tvl source),
        timestamp: stacks-block-height
      }
    )
    
    (ok true)
  )
)

;; Update TVL for a source
(define-public (update-tvl (source-id uint) (new-tvl uint))
  (let
    (
      (source (unwrap! (map-get? yield-sources source-id) ERR-SOURCE-NOT-FOUND))
    )
    (asserts! (is-authorized-updater) ERR-NOT-AUTHORIZED)
    
    (map-set yield-sources source-id
      (merge source {
        tvl: new-tvl,
        last-updated: stacks-block-height
      })
    )
    
    (ok true)
  )
)

;; Deactivate a yield source
(define-public (deactivate-source (source-id uint))
  (let
    (
      (source (unwrap! (map-get? yield-sources source-id) ERR-SOURCE-NOT-FOUND))
    )
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    
    (map-set yield-sources source-id
      (merge source { is-active: false })
    )
    (ok true)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - User Yield Tracking
;; ============================================

;; Start tracking yield for a user on a specific source
(define-public (start-tracking
    (source-id uint)
    (principal-amount uint)
  )
  (let
    (
      (source (unwrap! (map-get? yield-sources source-id) ERR-SOURCE-NOT-FOUND))
      (existing-tracking (map-get? user-yield-tracking { user: tx-sender, source-id: source-id }))
      (user-totals (default-to 
        { total-earned: u0, total-claimed: u0, sources-count: u0, last-updated: u0 }
        (map-get? user-total-yield tx-sender)))
    )
    (asserts! (get is-active source) ERR-SOURCE-INACTIVE)
    (asserts! (>= principal-amount (get min-deposit source)) ERR-INVALID-RATE)
    (asserts! (is-none existing-tracking) ERR-ALREADY-EXISTS)
    
    ;; Create tracking entry
    (map-set user-yield-tracking
      { user: tx-sender, source-id: source-id }
      {
        principal-amount: principal-amount,
        accumulated-yield: u0,
        last-claim-block: stacks-block-height,
        entry-block: stacks-block-height,
        entry-apy: (get current-apy source)
      }
    )
    
    ;; Update user totals
    (map-set user-total-yield tx-sender
      (merge user-totals {
        sources-count: (+ (get sources-count user-totals) u1),
        last-updated: stacks-block-height
      })
    )
    
    (ok true)
  )
)

;; Update principal amount being tracked
(define-public (update-tracking-amount
    (source-id uint)
    (new-amount uint)
  )
  (let
    (
      (source (unwrap! (map-get? yield-sources source-id) ERR-SOURCE-NOT-FOUND))
      (tracking (unwrap! (map-get? user-yield-tracking { user: tx-sender, source-id: source-id }) ERR-USER-NOT-FOUND))
      (accumulated (calculate-accumulated-yield 
                     (get principal-amount tracking)
                     (get entry-apy tracking)
                     (get last-claim-block tracking)))
    )
    ;; Update tracking with new amount and accumulate earned yield
    (map-set user-yield-tracking
      { user: tx-sender, source-id: source-id }
      (merge tracking {
        principal-amount: new-amount,
        accumulated-yield: (+ (get accumulated-yield tracking) accumulated),
        last-claim-block: stacks-block-height,
        entry-apy: (get current-apy source)
      })
    )
    
    (ok true)
  )
)

;; Record yield claim (when user claims from actual protocol)
(define-public (record-yield-claim
    (source-id uint)
    (claimed-amount uint)
  )
  (let
    (
      (tracking (unwrap! (map-get? user-yield-tracking { user: tx-sender, source-id: source-id }) ERR-USER-NOT-FOUND))
      (user-totals (unwrap! (map-get? user-total-yield tx-sender) ERR-USER-NOT-FOUND))
    )
    ;; Update tracking
    (map-set user-yield-tracking
      { user: tx-sender, source-id: source-id }
      (merge tracking {
        accumulated-yield: u0,
        last-claim-block: stacks-block-height
      })
    )
    
    ;; Update user totals
    (map-set user-total-yield tx-sender
      (merge user-totals {
        total-earned: (+ (get total-earned user-totals) claimed-amount),
        total-claimed: (+ (get total-claimed user-totals) claimed-amount),
        last-updated: stacks-block-height
      })
    )
    
    ;; Update global yield distributed
    (var-set total-yield-distributed (+ (var-get total-yield-distributed) claimed-amount))
    
    (ok true)
  )
)

;; Stop tracking a source
(define-public (stop-tracking (source-id uint))
  (let
    (
      (tracking (unwrap! (map-get? user-yield-tracking { user: tx-sender, source-id: source-id }) ERR-USER-NOT-FOUND))
      (user-totals (unwrap! (map-get? user-total-yield tx-sender) ERR-USER-NOT-FOUND))
    )
    ;; Remove tracking (set to zero)
    (map-set user-yield-tracking
      { user: tx-sender, source-id: source-id }
      {
        principal-amount: u0,
        accumulated-yield: u0,
        last-claim-block: stacks-block-height,
        entry-block: u0,
        entry-apy: u0
      }
    )
    
    ;; Update user source count
    (map-set user-total-yield tx-sender
      (merge user-totals {
        sources-count: (if (> (get sources-count user-totals) u0)
                           (- (get sources-count user-totals) u1)
                           u0),
        last-updated: stacks-block-height
      })
    )
    
    (ok true)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - Admin
;; ============================================

;; Set new oracle address
(define-public (set-oracle (new-oracle principal))
  (begin
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (var-set rate-oracle new-oracle)
    (ok true)
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get yield source info
(define-read-only (get-yield-source (source-id uint))
  (map-get? yield-sources source-id)
)

;; Get source ID by name
(define-read-only (get-source-id-by-name (name (string-ascii 64)))
  (map-get? source-name-to-id name)
)

;; Get APY history for a source at a specific block
(define-read-only (get-apy-at-block (source-id uint) (target-block uint))
  (map-get? apy-history { source-id: source-id, snapshot-block: target-block })
)

;; Get user tracking info for a source
(define-read-only (get-user-tracking (user principal) (source-id uint))
  (map-get? user-yield-tracking { user: user, source-id: source-id })
)

;; Get user total yield info
(define-read-only (get-user-yield-totals (user principal))
  (map-get? user-total-yield user)
)

;; Get total sources
(define-read-only (get-total-sources)
  (var-get total-sources)
)

;; Get total yield distributed
(define-read-only (get-total-yield-distributed)
  (var-get total-yield-distributed)
)

;; Get current oracle
(define-read-only (get-oracle)
  (var-get rate-oracle)
)