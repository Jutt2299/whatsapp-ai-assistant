/**
 * Financial Analysis & Expense Management Service — Phase 6 Deliverable
 *
 * Features:
 * 1. Amex / credit card expense categorization & review
 * 2. Spending pattern detection & anomaly alerts
 * 3. Monthly financial reports & budget comparisons
 * 4. Excel-style spreadsheet data generation
 * 5. Accountant-ready summaries
 * 6. Multi-currency support
 */

class FinanceService {
  constructor() {

    // Spending categories
    this.categories = [
      { id: 'travel',       label: 'Travel & Flights',        icon: 'plane',   color: '#0891B2', budget: 8000  },
      { id: 'hotels',       label: 'Hotels & Accommodation',  icon: 'hotel',   color: '#7C3AED', budget: 5000  },
      { id: 'dining',       label: 'Dining & Restaurants',    icon: 'fork',    color: '#D97706', budget: 2000  },
      { id: 'consulting',   label: 'Consulting & Legal',      icon: 'brief',   color: '#DC2626', budget: 6000  },
      { id: 'marketing',    label: 'Marketing & Advertising', icon: 'chart',   color: '#059669', budget: 3000  },
      { id: 'technology',   label: 'Technology & IT',         icon: 'laptop',  color: '#1E40AF', budget: 4000  },
      { id: 'utilities',    label: 'Utilities & Office',      icon: 'office',  color: '#64748B', budget: 1500  },
      { id: 'entertainment',label: 'Entertainment & Events',  icon: 'star',    color: '#BE185D', budget: 1000  },
      { id: 'personal',     label: 'Personal & Family',       icon: 'home',    color: '#9333EA', budget: 3000  }
    ];

    // Amex + Corporate Card transactions (last 60 days)
    this.transactions = [
      // ── Travel
      { id: 'exp_001', date: '2026-09-28', merchant: 'Iberia Airlines',        category: 'travel',        amount: 3280,  currency: 'USD', card: 'Amex Platinum',    description: 'MTY-MEX-MAD Premium Economy x3', status: 'cleared',  flag: null },
      { id: 'exp_002', date: '2026-09-20', merchant: 'Aeromexico',              category: 'travel',        amount: 1240,  currency: 'USD', card: 'Amex Platinum',    description: 'Solo Business Trip MTY-CDMX',    status: 'cleared',  flag: null },
      { id: 'exp_003', date: '2026-09-14', merchant: 'United Airlines',         category: 'travel',        amount: 890,   currency: 'USD', card: 'Amex Business',    description: 'Conference Trip MTY-ORD',        status: 'cleared',  flag: null },
      // ── Hotels
      { id: 'exp_004', date: '2026-09-28', merchant: 'Hotel Wellington Madrid', category: 'hotels',        amount: 2180,  currency: 'USD', card: 'Elevate Vault',    description: 'Family Suite 4 Nights Madrid',   status: 'pending',  flag: null },
      { id: 'exp_005', date: '2026-09-21', merchant: 'JW Marriott CDMX',        category: 'hotels',        amount: 680,   currency: 'USD', card: 'Amex Platinum',    description: 'Business Trip Accommodation',    status: 'cleared',  flag: null },
      // ── Dining
      { id: 'exp_006', date: '2026-09-27', merchant: 'Pujol Restaurante',       category: 'dining',        amount: 420,   currency: 'USD', card: 'Amex Platinum',    description: 'Client Dinner CDMX',            status: 'cleared',  flag: null },
      { id: 'exp_007', date: '2026-09-23', merchant: 'El Bajio',                category: 'dining',        amount: 180,   currency: 'MXN', card: 'Amex Business',    description: 'Team Lunch',                     status: 'cleared',  flag: null },
      { id: 'exp_008', date: '2026-09-18', merchant: 'Unnamed Restaurant',      category: 'dining',        amount: 1850,  currency: 'USD', card: 'Amex Platinum',    description: 'Unusual high dining charge',     status: 'cleared',  flag: 'ANOMALY' },
      // ── Consulting & Legal
      { id: 'exp_009', date: '2026-09-22', merchant: 'XYZ Consulting Group',    category: 'consulting',    amount: 2400,  currency: 'USD', card: 'Amex Business',    description: 'IT Infrastructure Consulting',   status: 'cleared',  flag: null },
      { id: 'exp_010', date: '2026-09-15', merchant: 'Legal Associates PLLC',   category: 'consulting',    amount: 1200,  currency: 'USD', card: 'Amex Business',    description: 'September Legal Retainer',       status: 'cleared',  flag: null },
      // ── Marketing
      { id: 'exp_011', date: '2026-09-12', merchant: 'Creative Edge Marketing', category: 'marketing',     amount: 1800,  currency: 'USD', card: 'Amex Business',    description: 'Monthly Marketing Retainer',    status: 'cleared',  flag: null },
      { id: 'exp_012', date: '2026-09-05', merchant: 'Google Ads',              category: 'marketing',     amount: 650,   currency: 'USD', card: 'Amex Business',    description: 'Digital Advertising Sep 2026',   status: 'cleared',  flag: null },
      // ── Technology
      { id: 'exp_013', date: '2026-09-10', merchant: 'TechSolutions Ltd',       category: 'technology',    amount: 3500,  currency: 'USD', card: 'Amex Business',    description: 'IT Infrastructure Setup',        status: 'pending',  flag: null },
      { id: 'exp_014', date: '2026-09-08', merchant: 'Microsoft 365',           category: 'technology',    amount: 185,   currency: 'USD', card: 'Amex Business',    description: 'Annual Office 365 Subscription', status: 'cleared',  flag: null },
      // ── Utilities
      { id: 'exp_015', date: '2026-09-01', merchant: 'WeWork Monterrey',        category: 'utilities',     amount: 1200,  currency: 'USD', card: 'Amex Business',    description: 'Monthly Office Space Sep 2026',  status: 'cleared',  flag: null },
      // ── Personal
      { id: 'exp_016', date: '2026-09-25', merchant: 'El Palacio de Hierro',    category: 'personal',      amount: 340,   currency: 'USD', card: 'Amex Platinum',    description: 'Family Shopping',               status: 'cleared',  flag: null },
      { id: 'exp_017', date: '2026-09-16', merchant: 'Cinepolis',               category: 'entertainment', amount: 65,    currency: 'MXN', card: 'Amex Platinum',    description: 'Family Movie Night',            status: 'cleared',  flag: null }
    ];

    // Currency rates (simplified)
    this.fxRates = { USD: 1, MXN: 0.053, EUR: 1.08 };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  _toUSD(amount, currency) {
    return Math.round((amount * (this.fxRates[currency] || 1)) * 100) / 100;
  }

  getAllTransactions(filters = {}) {
    let txns = this.transactions;
    if (filters.category) txns = txns.filter(t => t.category === filters.category);
    if (filters.card)     txns = txns.filter(t => t.card.toLowerCase().includes(filters.card.toLowerCase()));
    if (filters.flag)     txns = txns.filter(t => t.flag === filters.flag);
    if (filters.status)   txns = txns.filter(t => t.status === filters.status);
    return txns;
  }

  getCategories() { return this.categories; }

  // ── Core Analytics ───────────────────────────────────────────────────────

  /**
   * Spending breakdown by category with budget comparison
   */
  getCategoryBreakdown() {
    const breakdown = this.categories.map(cat => {
      const catTxns = this.transactions.filter(t => t.category === cat.id);
      const totalUSD = catTxns.reduce((sum, t) => sum + this._toUSD(t.amount, t.currency), 0);
      const budgetUsedPct = cat.budget ? Math.round((totalUSD / cat.budget) * 100) : null;
      const overBudget = cat.budget && totalUSD > cat.budget;

      return {
        ...cat,
        totalUSD: Math.round(totalUSD),
        transactionCount: catTxns.length,
        budgetUsedPct,
        overBudget,
        status: overBudget ? 'OVER_BUDGET' : (budgetUsedPct > 80 ? 'NEAR_LIMIT' : 'ON_TRACK')
      };
    }).filter(c => c.transactionCount > 0);

    const grandTotal = breakdown.reduce((sum, c) => sum + c.totalUSD, 0);
    return { breakdown, grandTotalUSD: Math.round(grandTotal) };
  }

  /**
   * Detect anomalies: unusually large transactions, duplicate merchants, etc.
   */
  detectAnomalies() {
    const anomalies = [];

    // 1. Flag explicitly tagged anomalies
    const flagged = this.transactions.filter(t => t.flag === 'ANOMALY');
    flagged.forEach(t => {
      anomalies.push({
        transactionId: t.id,
        type: 'UNUSUAL_AMOUNT',
        severity: 'HIGH',
        description: `Unusually high charge of $${t.amount} ${t.currency} at "${t.merchant}" — verify this transaction.`,
        transaction: t
      });
    });

    // 2. Large single transactions (>$2000 USD)
    this.transactions.forEach(t => {
      const amtUSD = this._toUSD(t.amount, t.currency);
      if (amtUSD > 2000 && t.flag !== 'ANOMALY') {
        anomalies.push({
          transactionId: t.id,
          type: 'LARGE_TRANSACTION',
          severity: 'MEDIUM',
          description: `Large transaction of $${Math.round(amtUSD)} USD at "${t.merchant}" — confirm this is authorized.`,
          transaction: t
        });
      }
    });

    // 3. Over-budget categories
    const { breakdown } = this.getCategoryBreakdown();
    breakdown.filter(c => c.overBudget).forEach(c => {
      anomalies.push({
        type: 'OVER_BUDGET',
        severity: 'MEDIUM',
        description: `Category "${c.label}" is $${c.totalUSD - c.budget} USD over monthly budget of $${c.budget}.`,
        category: c.id
      });
    });

    // 4. Pending transactions (uncleared)
    const pending = this.transactions.filter(t => t.status === 'pending');
    if (pending.length > 0) {
      anomalies.push({
        type: 'PENDING_CHARGES',
        severity: 'LOW',
        description: `${pending.length} transaction(s) still pending clearance totaling $${Math.round(pending.reduce((s, t) => s + this._toUSD(t.amount, t.currency), 0))} USD.`,
        transactions: pending
      });
    }

    return { anomalyCount: anomalies.length, anomalies };
  }

  /**
   * Generate a full monthly financial report
   */
  generateMonthlyReport(month) {
    const now = new Date();
    const period = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { breakdown, grandTotalUSD } = this.getCategoryBreakdown();
    const { anomalyCount, anomalies } = this.detectAnomalies();
    const totalBudget = this.categories.reduce((s, c) => s + c.budget, 0);
    const savingsVsBudget = totalBudget - grandTotalUSD;

    // Top merchants
    const merchantMap = {};
    this.transactions.forEach(t => {
      const usd = this._toUSD(t.amount, t.currency);
      merchantMap[t.merchant] = (merchantMap[t.merchant] || 0) + usd;
    });
    const topMerchants = Object.entries(merchantMap)
      .map(([merchant, total]) => ({ merchant, totalUSD: Math.round(total) }))
      .sort((a, b) => b.totalUSD - a.totalUSD)
      .slice(0, 5);

    // Card breakdown
    const cardMap = {};
    this.transactions.forEach(t => {
      const usd = this._toUSD(t.amount, t.currency);
      cardMap[t.card] = (cardMap[t.card] || 0) + usd;
    });
    const cardBreakdown = Object.entries(cardMap).map(([card, total]) => ({ card, totalUSD: Math.round(total) }));

    return {
      reportId: `FIN-RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      period,
      summary: {
        totalTransactions: this.transactions.length,
        grandTotalUSD,
        totalBudgetUSD: totalBudget,
        savingsVsBudget,
        budgetUsedPct: Math.round((grandTotalUSD / totalBudget) * 100),
        anomalyCount,
        overBudgetCategories: breakdown.filter(c => c.overBudget).length,
        pendingTransactions: this.transactions.filter(t => t.status === 'pending').length
      },
      categoryBreakdown: breakdown,
      topMerchants,
      cardBreakdown,
      anomalies,
      recommendations: this._generateRecommendations(breakdown, anomalies)
    };
  }

  /**
   * Spreadsheet-ready export format
   */
  exportToSpreadsheet() {
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Currency', 'Amount (USD)', 'Card', 'Description', 'Status', 'Flag'];
    const rows = this.transactions.map(t => [
      t.date,
      t.merchant,
      this.categories.find(c => c.id === t.category)?.label || t.category,
      t.amount,
      t.currency,
      this._toUSD(t.amount, t.currency),
      t.card,
      t.description,
      t.status.toUpperCase(),
      t.flag || 'CLEAR'
    ]);
    const { grandTotalUSD } = this.getCategoryBreakdown();
    return {
      success: true,
      filename: `ZainulFamilyOffice_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`,
      headers,
      rows,
      totalRows: rows.length,
      grandTotalUSD,
      message: 'Spreadsheet data ready. Connect Google Drive OAuth to auto-upload to Financial Reports folder.'
    };
  }

  _generateRecommendations(breakdown, anomalies) {
    const recs = [];
    const overBudget = breakdown.filter(c => c.overBudget);
    if (overBudget.length > 0) {
      recs.push(`⚠️ Review spending in: ${overBudget.map(c => c.label).join(', ')} — these categories exceeded monthly budget.`);
    }
    const highAnomalies = anomalies.filter(a => a.severity === 'HIGH');
    if (highAnomalies.length > 0) {
      recs.push('🚨 Immediately verify ' + highAnomalies.length + ' high-severity anomalous transaction(s) flagged by Aura.');
    }
    const travelTotal = breakdown.find(c => c.id === 'travel');
    if (travelTotal && travelTotal.totalUSD > 4000) {
      recs.push('✈️ Consider booking travel 3+ weeks in advance to leverage Amex Platinum travel credits and Iberia Gold tier benefits.');
    }
    recs.push('📊 Monthly report has been generated and is ready to be forwarded to your accountant at accountant@zainulgroup.com.');
    return recs;
  }
}

module.exports = new FinanceService();
