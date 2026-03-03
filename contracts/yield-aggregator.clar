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