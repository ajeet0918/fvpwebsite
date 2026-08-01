type CartQuantityControlProps = {
  productName: string;
  quantity: number;
  compact?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
};

export function CartQuantityControl({
  productName,
  quantity,
  compact = false,
  onDecrease,
  onIncrease
}: CartQuantityControlProps) {
  const className = compact ? "cart-stepper cart-stepper-compact" : "cart-stepper";

  return (
    <div className={className} aria-label={`Quantity for ${productName}`}>
      <button
        type="button"
        onClick={onDecrease}
        aria-label={`Decrease quantity for ${productName}`}
        title="Decrease quantity"
      >
        &minus;
      </button>
      <output className="cart-stepper-value" aria-live="polite" aria-label={`${quantity} in cart`}>
        {quantity}
      </output>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={`Increase quantity for ${productName}`}
        title="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
