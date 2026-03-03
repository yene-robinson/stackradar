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