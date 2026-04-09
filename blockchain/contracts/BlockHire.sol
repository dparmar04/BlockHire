// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BlockHire
 * @author Your Name
 * @notice A decentralized escrow system for freelance hiring
 * @dev Implements secure payment escrow with dispute resolution
 */
contract BlockHire {

    // ============ STATE VARIABLES ============
    
    address public owner;
    uint256 public platformFeePercent = 2; // 2% platform fee
    uint256 public jobCounter;
    
    // Time constants
    uint256 public constant AUTO_RELEASE_PERIOD = 7 days;
    uint256 public constant DISPUTE_PERIOD = 3 days;
    
    // ============ ENUMS ============
    
    enum JobStatus {
        Open,           // 0: Job created, waiting for freelancer
        InProgress,     // 1: Freelancer accepted, working
        Submitted,      // 2: Freelancer submitted work
        Completed,      // 3: Client approved, payment released
        Disputed,       // 4: Either party raised dispute
        Cancelled,      // 5: Job cancelled
        AutoReleased    // 6: Auto-released after timeout
    }

    // ============ STRUCTS ============
    
    struct Job {
        uint256 id;
        address client;
        address freelancer;
        
        string title;
        string description;
        string requirementsIPFS;     // IPFS hash for detailed requirements
        string deliverableIPFS;      // IPFS hash for submitted work
        
        uint256 paymentAmount;       // Amount in Wei (excluding platform fee)
        uint256 platformFee;         // Platform fee in Wei
        
        JobStatus status;
        
        uint256 createdAt;
        uint256 acceptedAt;
        uint256 submittedAt;
        uint256 completedAt;
        
        string disputeReason;
        address disputeRaisedBy;
    }

    // ============ MAPPINGS ============
    
    mapping(uint256 => Job) public jobs;
    mapping(address => uint256[]) public clientJobs;
    mapping(address => uint256[]) public freelancerJobs;
    
    // ============ EVENTS ============
    
    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        string title,
        uint256 paymentAmount,
        uint256 timestamp
    );
    
    event JobAccepted(
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 timestamp
    );
    
    event WorkSubmitted(
        uint256 indexed jobId,
        string deliverableIPFS,
        uint256 timestamp
    );
    
    event PaymentReleased(
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 amount,
        uint256 timestamp
    );
    
    event JobCancelled(
        uint256 indexed jobId,
        address indexed cancelledBy,
        uint256 refundAmount,
        uint256 timestamp
    );
    
    event DisputeRaised(
        uint256 indexed jobId,
        address indexed raisedBy,
        string reason,
        uint256 timestamp
    );
    
    event DisputeResolved(
        uint256 indexed jobId,
        address indexed winner,
        uint256 amount,
        uint256 timestamp
    );
    
    event AutoReleaseTriggered(
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 amount,
        uint256 timestamp
    );

    // ============ MODIFIERS ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyClient(uint256 _jobId) {
        require(msg.sender == jobs[_jobId].client, "Only client can call this");
        _;
    }
    
    modifier onlyFreelancer(uint256 _jobId) {
        require(msg.sender == jobs[_jobId].freelancer, "Only freelancer can call this");
        _;
    }
    
    modifier jobExists(uint256 _jobId) {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor() {
        owner = msg.sender;
    }

    // ============ CORE FUNCTIONS ============
    
    /**
     * @notice Create a new job with upfront payment
     * @dev Client must send ETH with this call (payment + platform fee)
     * @param _title Job title
     * @param _description Short description
     * @param _requirementsIPFS IPFS hash of detailed requirements document
     */
    function createJob(
        string memory _title,
        string memory _description,
        string memory _requirementsIPFS
    ) external payable returns (uint256) {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_requirementsIPFS).length > 0, "Requirements IPFS hash required");
        
        // Calculate fee split
        uint256 totalAmount = msg.value;
        uint256 fee = (totalAmount * platformFeePercent) / 100;
        uint256 paymentToFreelancer = totalAmount - fee;
        
        jobCounter++;
        uint256 newJobId = jobCounter;
        
        jobs[newJobId] = Job({
            id: newJobId,
            client: msg.sender,
            freelancer: address(0),
            title: _title,
            description: _description,
            requirementsIPFS: _requirementsIPFS,
            deliverableIPFS: "",
            paymentAmount: paymentToFreelancer,
            platformFee: fee,
            status: JobStatus.Open,
            createdAt: block.timestamp,
            acceptedAt: 0,
            submittedAt: 0,
            completedAt: 0,
            disputeReason: "",
            disputeRaisedBy: address(0)
        });
        
        clientJobs[msg.sender].push(newJobId);
        
        emit JobCreated(
            newJobId,
            msg.sender,
            _title,
            paymentToFreelancer,
            block.timestamp
        );
        
        return newJobId;
    }
    
    /**
     * @notice Accept a job as a freelancer
     * @param _jobId The job ID to accept
     */
    function acceptJob(uint256 _jobId) external jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        
        require(job.status == JobStatus.Open, "Job is not open");
        require(msg.sender != job.client, "Client cannot accept own job");
        require(job.freelancer == address(0), "Job already has a freelancer");
        
        job.freelancer = msg.sender;
        job.status = JobStatus.InProgress;
        job.acceptedAt = block.timestamp;
        
        freelancerJobs[msg.sender].push(_jobId);
        
        emit JobAccepted(_jobId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Submit completed work with deliverable
     * @param _jobId The job ID
     * @param _deliverableIPFS IPFS hash of the delivered work
     */
    function submitWork(
        uint256 _jobId,
        string memory _deliverableIPFS
    ) external jobExists(_jobId) onlyFreelancer(_jobId) {
        Job storage job = jobs[_jobId];
        
        require(job.status == JobStatus.InProgress, "Job is not in progress");
        require(bytes(_deliverableIPFS).length > 0, "Deliverable IPFS hash required");
        
        job.deliverableIPFS = _deliverableIPFS;
        job.status = JobStatus.Submitted;
        job.submittedAt = block.timestamp;
        
        emit WorkSubmitted(_jobId, _deliverableIPFS, block.timestamp);
    }
    
    /**
     * @notice Client approves work and releases payment
     * @param _jobId The job ID
     */
    function approveAndRelease(uint256 _jobId) 
        external 
        jobExists(_jobId) 
        onlyClient(_jobId) 
    {
        Job storage job = jobs[_jobId];
        
        require(job.status == JobStatus.Submitted, "Work not submitted yet");
        
        job.status = JobStatus.Completed;
        job.completedAt = block.timestamp;
        
        // Transfer payment to freelancer
        (bool success, ) = payable(job.freelancer).call{value: job.paymentAmount}("");
        require(success, "Payment transfer failed");
        
        // Transfer platform fee to owner
        (bool feeSuccess, ) = payable(owner).call{value: job.platformFee}("");
        require(feeSuccess, "Fee transfer failed");
        
        emit PaymentReleased(
            _jobId,
            job.freelancer,
            job.paymentAmount,
            block.timestamp
        );
    }
    
    /**
     * @notice Trigger auto-release after timeout period
     * @dev Anyone can call this after AUTO_RELEASE_PERIOD has passed
     * @param _jobId The job ID
     */
    function triggerAutoRelease(uint256 _jobId) external jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        
        require(job.status == JobStatus.Submitted, "Work not submitted");
        require(
            block.timestamp >= job.submittedAt + AUTO_RELEASE_PERIOD,
            "Auto-release period not reached"
        );
        
        job.status = JobStatus.AutoReleased;
        job.completedAt = block.timestamp;
        
        // Transfer payment to freelancer
        (bool success, ) = payable(job.freelancer).call{value: job.paymentAmount}("");
        require(success, "Payment transfer failed");
        
        // Transfer platform fee to owner
        (bool feeSuccess, ) = payable(owner).call{value: job.platformFee}("");
        require(feeSuccess, "Fee transfer failed");
        
        emit AutoReleaseTriggered(
            _jobId,
            job.freelancer,
            job.paymentAmount,
            block.timestamp
        );
    }
    
    /**
     * @notice Cancel job (only if no freelancer yet or freelancer hasn't submitted)
     * @param _jobId The job ID
     */
    function cancelJob(uint256 _jobId) external jobExists(_jobId) onlyClient(_jobId) {
        Job storage job = jobs[_jobId];
        
        require(
            job.status == JobStatus.Open || job.status == JobStatus.InProgress,
            "Cannot cancel at this stage"
        );
        
        // If in progress but no work submitted, allow cancellation
        if (job.status == JobStatus.InProgress) {
            require(
                bytes(job.deliverableIPFS).length == 0,
                "Cannot cancel after work submitted"
            );
        }
        
        uint256 refundAmount = job.paymentAmount + job.platformFee;
        job.status = JobStatus.Cancelled;
        
        // Refund client
        (bool success, ) = payable(job.client).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit JobCancelled(_jobId, msg.sender, refundAmount, block.timestamp);
    }
    
    /**
     * @notice Raise a dispute
     * @param _jobId The job ID
     * @param _reason Reason for dispute
     */
    function raiseDispute(
        uint256 _jobId,
        string memory _reason
    ) external jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        
        require(
            msg.sender == job.client || msg.sender == job.freelancer,
            "Only parties can raise dispute"
        );
        require(
            job.status == JobStatus.Submitted || job.status == JobStatus.InProgress,
            "Cannot dispute at this stage"
        );
        require(bytes(_reason).length > 0, "Dispute reason required");
        
        job.status = JobStatus.Disputed;
        job.disputeReason = _reason;
        job.disputeRaisedBy = msg.sender;
        
        emit DisputeRaised(_jobId, msg.sender, _reason, block.timestamp);
    }
    
    /**
     * @notice Resolve dispute (only owner/arbitrator)
     * @param _jobId The job ID
     * @param _releaseToFreelancer True to pay freelancer, false to refund client
     */
    function resolveDispute(
        uint256 _jobId,
        bool _releaseToFreelancer
    ) external onlyOwner jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        
        require(job.status == JobStatus.Disputed, "Job is not disputed");
        
        job.completedAt = block.timestamp;
        
        if (_releaseToFreelancer) {
            job.status = JobStatus.Completed;
            
            // Pay freelancer
            (bool success, ) = payable(job.freelancer).call{value: job.paymentAmount}("");
            require(success, "Payment transfer failed");
            
            // Platform fee to owner
            (bool feeSuccess, ) = payable(owner).call{value: job.platformFee}("");
            require(feeSuccess, "Fee transfer failed");
            
            emit DisputeResolved(_jobId, job.freelancer, job.paymentAmount, block.timestamp);
        } else {
            job.status = JobStatus.Cancelled;
            
            // Refund client (full amount)
            uint256 refundAmount = job.paymentAmount + job.platformFee;
            (bool success, ) = payable(job.client).call{value: refundAmount}("");
            require(success, "Refund transfer failed");
            
            emit DisputeResolved(_jobId, job.client, refundAmount, block.timestamp);
        }
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get full job details
     * @param _jobId The job ID
     */
    function getJob(uint256 _jobId) external view jobExists(_jobId) returns (Job memory) {
        return jobs[_jobId];
    }
    
    /**
     * @notice Get all jobs by a client
     * @param _client Client address
     */
    function getClientJobs(address _client) external view returns (uint256[] memory) {
        return clientJobs[_client];
    }
    
    /**
     * @notice Get all jobs by a freelancer
     * @param _freelancer Freelancer address
     */
    function getFreelancerJobs(address _freelancer) external view returns (uint256[] memory) {
        return freelancerJobs[_freelancer];
    }
    
    /**
     * @notice Get all open jobs
     */
    function getOpenJobs() external view returns (Job[] memory) {
        uint256 openCount = 0;
        
        // Count open jobs
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (jobs[i].status == JobStatus.Open) {
                openCount++;
            }
        }
        
        // Create array and populate
        Job[] memory openJobs = new Job[](openCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (jobs[i].status == JobStatus.Open) {
                openJobs[index] = jobs[i];
                index++;
            }
        }
        
        return openJobs;
    }
    
    /**
     * @notice Check if auto-release is available
     * @param _jobId The job ID
     */
    function canAutoRelease(uint256 _jobId) external view jobExists(_jobId) returns (bool) {
        Job memory job = jobs[_jobId];
        
        return (
            job.status == JobStatus.Submitted &&
            block.timestamp >= job.submittedAt + AUTO_RELEASE_PERIOD
        );
    }
    
    /**
     * @notice Get time remaining until auto-release
     * @param _jobId The job ID
     */
    function getAutoReleaseTimeRemaining(uint256 _jobId) 
        external 
        view 
        jobExists(_jobId) 
        returns (uint256) 
    {
        Job memory job = jobs[_jobId];
        
        if (job.status != JobStatus.Submitted) {
            return 0;
        }
        
        uint256 releaseTime = job.submittedAt + AUTO_RELEASE_PERIOD;
        
        if (block.timestamp >= releaseTime) {
            return 0;
        }
        
        return releaseTime - block.timestamp;
    }
    
    /**
     * @notice Get total number of jobs
     */
    function getTotalJobs() external view returns (uint256) {
        return jobCounter;
    }
    
    /**
     * @notice Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Update platform fee (only owner)
     * @param _newFeePercent New fee percentage (0-10)
     */
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 10, "Fee cannot exceed 10%");
        platformFeePercent = _newFeePercent;
    }
    
    /**
     * @notice Transfer ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
    
    // ============ FALLBACK ============
    
    receive() external payable {
        revert("Direct payments not accepted");
    }
}