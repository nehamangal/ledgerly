from collections import defaultdict
from datetime import datetime

def detect_subscriptions(transactions):
    """
    Groups by merchant. If a merchant has multiple transactions 
    with similar amounts spaced roughly ~30 days apart, flag as subscription.
    """
    merchant_groups = defaultdict(list)
    
    for tx in transactions:
        merchant = tx.get('description')
        amount = tx.get('amount')
        date_str = tx.get('date')
        
        if merchant and amount and date_str:
            merchant_groups[merchant].append({
                'amount': amount,
                'date': datetime.strptime(date_str.split('T')[0], '%Y-%m-%d')
            })
            
    subscriptions = []
    for merchant, txs in merchant_groups.items():
        if len(txs) >= 2:
            # Sort by date
            txs = sorted(txs, key=lambda x: x['date'])
            # Simple heuristic: check if at least two transactions have similar amounts
            # and a gap close to 30 days
            for i in range(len(txs) - 1):
                diff_days = abs((txs[i+1]['date'] - txs[i]['date']).days)
                amount_diff = abs(txs[i+1]['amount'] - txs[i]['amount'])
                
                if 25 <= diff_days <= 35 and amount_diff < (txs[i]['amount'] * 0.05):
                    subscriptions.append({
                        "merchant": merchant,
                        "amount": txs[i]['amount'],
                        "frequency": "Monthly"
                    })
                    break
                    
    return subscriptions

def detect_anomalies(transactions):
    """
    Calculates average spending per category. 
    If a transaction is 2x+ the category average, flag it.
    """
    category_totals = defaultdict(list)
    
    for tx in transactions:
        category = tx.get('type', 'General')
        amount = tx.get('amount', 0)
        category_totals[category].append(tx)
        
    anomalies = []
    for category, txs in category_totals.items():
        if not txs:
            continue
        amounts = [t['amount'] for t in txs]
        avg_amount = sum(amounts) / len(amounts)
        
        for tx in txs:
            if tx['amount'] >= (avg_amount * 2.0) and tx['amount'] > 50: # threshold check
                anomalies.append({
                    "id": tx.get('id'),
                    "merchant": tx.get('merchantName'),
                    "amount": tx['amount'],
                    "category": category,
                    "average": round(avg_amount, 2),
                    "reason": f"Spent ₹{tx['amount']} on {category}, which is 2x+ your average of ₹{round(avg_amount, 2)}"
                })
                
    return anomalies