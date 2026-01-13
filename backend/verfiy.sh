#!/bin/bash

echo "Checking Project 7 amounts..."
echo ""

# Check database
curl -s http://localhost:8000/projects/7 | jq '{
  project_id: .id,
  name: .name,
  total_budget_mnt: .total_budget_mnt,
  milestone_count: (.milestones | length),
  first_milestone_amount: .milestones[0].amount,
  calculated_total: (.milestones[0].amount * (.milestones | length))
}'

echo ""
echo "Checking blockchain..."
curl -s http://localhost:8000/debug/compare-amounts/7 | jq '{
  project_id: .project_id,
  on_chain_id: .on_chain_id,
  total_budget_db: .total_budget_db,
  total_budget_blockchain: .total_budget_blockchain,
  match: (.total_budget_db == .total_budget_blockchain),
  milestone_match: .milestones[0].match,
  first_milestone_db: .milestones[0].db_amount_mnt,
  first_milestone_bc: .milestones[0].blockchain_amount_mnt
}'


#!/bin/bash

echo "=========================================="
echo "FULL PROJECT 7 DIAGNOSTIC"
echo "=========================================="
echo ""

echo "1️⃣ Database State:"
curl -s http://localhost:8000/projects/7 | jq '{
  id: .id,
  name: .name,
  total_budget: .total_budget_mnt,
  milestones: [.milestones[] | {
    order: .order_index,
    desc: .description[0:40],
    amount: .amount
  }],
  milestone_count: (.milestones | length),
  sum_of_milestones: ([.milestones[].amount] | add)
}'

echo ""
echo "2️⃣ Blockchain State (On-Chain ID: 6):"
curl -s http://localhost:8000/debug/project-on-chain/7

echo ""
echo "3️⃣ Transaction Details:"
curl -s http://localhost:8000/debug/transaction-receipt/0xe794c44fd1fd2d45dd71b40cbf03b96bd9dbcf59aacb4920252b552f14876cda | jq '{
  tx_hash: .transaction_hash,
  status: .status,
  from: .from,
  to: .to,
  event: .decoded_events[0]
}'

echo ""
echo "4️⃣ Detailed Comparison:"
curl -s http://localhost:8000/debug/compare-amounts/7 | jq '{
  total_match: (.total_budget_db == .total_budget_blockchain),
  db_budget: .total_budget_db,
  bc_budget: .total_budget_blockchain,
  db_milestone_count: .milestone_count,
  bc_milestone_count: (.milestones | length),
  milestones: [.milestones[] | {
    idx: .milestone_index,
    db_amt: .db_amount_mnt,
    bc_amt: .blockchain_amount_mnt,
    match: .match
  }]
}'