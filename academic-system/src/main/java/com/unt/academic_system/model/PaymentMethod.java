package com.unt.academic_system.model;

public enum PaymentMethod {
    CASH("Cash"),
    BANK_TRANSFER("Bank Transfer"),
    MOBILE_MONEY("Mobile Money"),
    CREDIT_CARD("Credit Card"),
    DEBIT_CARD("Debit Card"),
    CHEQUE("Cheque"),
    ONLINE("Online Payment");

    private final String displayName;

    PaymentMethod(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
