module blockchain::optic_gov {
    use sui::transfer;
    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::tx_context::{Self, TxContext};
    use std::string::{String};

    // --- Errors ---
    const EInvalidAmount: u64 = 1;
    const EInsufficientFunds: u64 = 2;
    const ENotContractor: u64 = 3;

    // ====================================================================
    // 1. OBJECTS
    // ====================================================================

    /// The Capability object (The Key). 
    /// Only the address holding this can authorize payments.
    struct OracleCap has key, store {
        id: UID,
    }

    /// The Project Object (The Vault).
    /// Holds the SUI funds and the project metadata.
    struct Project has key {
        id: UID,
        funder: address,
        contractor: address,
        escrow_balance: Balance<SUI>, 
        total_budget: u64,
        funds_released: u64,
        // In Sui, we often store evidence as a simple string or 
        // a dynamic field. Here we store the latest IPFS hash.
        latest_evidence_ipfs: String,
    }

    // ====================================================================
    // 2. INITIALIZATION
    // ====================================================================

    /// Runs once when the contract is published.
    fun init(ctx: &mut TxContext) {
        let cap = OracleCap { id: object::new(ctx) };
        
        // Send the "Key" to the deployer (whoever deployed the contract)
        transfer::transfer(cap, tx_context::sender(ctx));
    }

    // ====================================================================
    // 3. FUNCTIONS
    // ====================================================================

    /// CREATE: Anyone can call this to fund a new project.
    /// The funds are locked into a 'Shared Object'.
    public entry fun create_project(
        payment: Coin<SUI>,
        contractor: address,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        assert!(amount > 0, EInvalidAmount);

        let project = Project {
            id: object::new(ctx),
            funder: tx_context::sender(ctx),
            contractor,
            escrow_balance: coin::into_balance(payment),
            total_budget: amount,
            funds_released: 0,
            latest_evidence_ipfs: std::string::utf8(b"None"),
        };

        // Make the project visible to everyone (including the Oracle)
        transfer::share_object(project);
    }

    /// EVIDENCE: The Contractor updates the project with their work.
    public entry fun submit_evidence(
        project: &mut Project,
        ipfs_hash: String,
        ctx: &mut TxContext
    ) {
        // Only the designated contractor can submit evidence
        assert!(tx_context::sender(ctx) == project.contractor, ENotContractor);
        project.latest_evidence_ipfs = ipfs_hash;
    }

    /// RELEASE: Only the Oracle (holding the OracleCap) can release SUI.
    public entry fun release_payment(
        _cap: &OracleCap, 
        project: &mut Project, 
        amount: u64, 
        ctx: &mut TxContext
    ) {
        // Check if the vault has enough SUI
        assert!(balance::value(&project.escrow_balance) >= amount, EInsufficientFunds);
        
        // Take the amount out of the project vault
        let payout_balance = balance::split(&mut project.escrow_balance, amount);
        let payout_coin = coin::from_balance(payout_balance, ctx);
        
        // Update metadata
        project.funds_released = project.funds_released + amount;

        // Send the SUI directly to the contractor
        transfer::public_transfer(payout_coin, project.contractor);
    }
}