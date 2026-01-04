// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OpticGov
 * @dev Transparency-focused project management and funding contract.
 */
contract OpticGov {
    // --- Custom Errors ---
    error Unauthorized(address caller);
    error InvalidLength();
    error InvalidAmount();
    error InvalidMilestone(uint256 projectId, uint256 milestoneIndex);
    error AlreadyCompleted();
    error TransferFailed();
    error OnlyContractor(address contractor);
    error ProjectDoesNotExist();

    // --- State Variables ---
    address public immutable oracleAddress;
    uint256 public nextProjectId;

    struct Milestone {
        string description;
        uint256 amount; 
        bool isCompleted; 
        bool isReleased;  
        string evidenceIpfsHash; 
    }

    struct Project {
        address funder; 
        address contractor;
        uint256 totalBudget;
        uint256 fundsReleased;
        uint256 milestoneCount;
        Milestone[] milestones;
    }

    mapping(uint256 => Project) public projects;

    // --- Modifiers ---
    modifier onlyOracle() {
        if (msg.sender != oracleAddress) revert Unauthorized(msg.sender); 
        _;
    }

    // --- Events ---
    event ProjectCreated(uint256 indexed projectId, address indexed funder, address indexed contractor, uint256 budget);
    event MilestoneReleased(uint256 indexed projectId, uint256 indexed milestoneIndex, uint256 amount);
    event EvidenceSubmitted(uint256 indexed projectId, uint256 indexed milestoneIndex, string ipfsHash);

    constructor(address _oracleAddress) {
        if (_oracleAddress == address(0)) revert Unauthorized(address(0));
        oracleAddress = _oracleAddress;
    }

    /**
     * @notice Creates a new project with set milestones.
     * @param _contractor The wallet address of the worker/contractor.
     * @param _milestoneAmounts Array of costs for each milestone.
     * @param _milestoneDescriptions Array of text descriptions for each milestone.
     */
    function createProject(
        address _contractor, // <--- FIXED: Removed the extra "_contract" identifier
        uint256[] calldata _milestoneAmounts,
        string[] calldata _milestoneDescriptions
    ) external payable returns (uint256) {
        if (_milestoneAmounts.length != _milestoneDescriptions.length) revert InvalidLength();
        if (_milestoneAmounts.length == 0) revert InvalidLength();

        uint256 totalProjectCost;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            totalProjectCost += _milestoneAmounts[i];
        }

        if (msg.value != totalProjectCost) revert InvalidAmount();

        uint256 projectId = nextProjectId++;
        Project storage newProject = projects[projectId];
        newProject.funder = msg.sender;
        newProject.contractor = _contractor;
        newProject.totalBudget = totalProjectCost;
        newProject.milestoneCount = _milestoneAmounts.length;
        
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            newProject.milestones.push(Milestone({
                description: _milestoneDescriptions[i],
                amount: _milestoneAmounts[i],
                isCompleted: false,
                isReleased: false,
                evidenceIpfsHash: ""
            }));
        }

        emit ProjectCreated(projectId, msg.sender, _contractor, totalProjectCost);
        return projectId;
    }

    function submitEvidence(
        uint256 _projectId, 
        uint256 _milestoneIndex, 
        string calldata _ipfsHash
    ) external {
        Project storage project = projects[_projectId];
        if (project.funder == address(0)) revert ProjectDoesNotExist();
        if (msg.sender != project.contractor) revert OnlyContractor(project.contractor);
        if (_milestoneIndex >= project.milestoneCount) revert InvalidMilestone(_projectId, _milestoneIndex);
        
        Milestone storage m = project.milestones[_milestoneIndex];
        if (m.isCompleted) revert AlreadyCompleted();

        m.evidenceIpfsHash = _ipfsHash;
        emit EvidenceSubmitted(_projectId, _milestoneIndex, _ipfsHash);
    }

    function releaseMilestone(
        uint256 _projectId, 
        uint256 _milestoneIndex, 
        bool _verdict
    ) external onlyOracle {
        Project storage project = projects[_projectId];
        if (_milestoneIndex >= project.milestoneCount) revert InvalidMilestone(_projectId, _milestoneIndex);
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        if (milestone.isCompleted) revert AlreadyCompleted();
        
        milestone.isCompleted = true; 
        
        if (_verdict) {
            milestone.isReleased = true; 
            project.fundsReleased += milestone.amount;

            // Using call instead of transfer for future-proofing and Mantle compatibility
            (bool success, ) = payable(project.contractor).call{value: milestone.amount}("");
            if (!success) revert TransferFailed();
            
            emit MilestoneReleased(_projectId, _milestoneIndex, milestone.amount);
        }
    }

    function getMilestone(uint256 _projectId, uint256 _index) external view returns (Milestone memory) {
        return projects[_projectId].milestones[_index];
    }

    // Safety: Allow the contract to receive ETH/MNT directly if needed
    receive() external payable {}
}