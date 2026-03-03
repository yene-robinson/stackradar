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