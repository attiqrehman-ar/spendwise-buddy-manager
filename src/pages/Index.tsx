import { useState, memo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, WalletCards, ArrowLeftRight, History, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  amount: number;
  description: string;
  user: "Attiq" | "Ahsan";
  date: Date;
}

interface ExpenseInput {
  amount: string;
  description: string;
}

// Memoized expense input form
const ExpenseForm = memo(({ 
  inputs, 
  onInputChange, 
  onSubmit 
}: { 
  inputs: ExpenseInput;
  onInputChange: (field: keyof ExpenseInput, value: string) => void;
  onSubmit: () => void;
}) => (
  <div className="space-y-4">
    <Input
      type="number"
      placeholder="Amount"
      value={inputs.amount}
      onChange={(e) => onInputChange("amount", e.target.value)}
    />
    <Input
      placeholder="Description"
      value={inputs.description}
      onChange={(e) => onInputChange("description", e.target.value)}
    />
    <Button className="w-full" onClick={onSubmit}>
      Add Expense
    </Button>
  </div>
));

ExpenseForm.displayName = "ExpenseForm";

// Memoized WalletCard component
const WalletCard = memo(({ 
  user, 
  total, 
  otherUserTotal,
  isActive,
  inputs,
  onToggleDropdown,
  onInputChange,
  onSubmit
}: { 
  user: "Attiq" | "Ahsan";
  total: number;
  otherUserTotal: number;
  isActive: boolean;
  inputs: ExpenseInput;
  onToggleDropdown: () => void;
  onInputChange: (field: keyof ExpenseInput, value: string) => void;
  onSubmit: () => void;
}) => {
  const balance = total - otherUserTotal;
  const status = balance === 0 ? "neutral" : balance > 0 ? "credit" : "debit";
  
  return (
    <div className="relative">
      <Card className="p-6 glass-card hover-scale">
        <div className="flex items-center gap-2 mb-4">
          <WalletCards className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{user === "Attiq" ? "Attiq" : "Ahsan"}'s Wallet</h2>
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold">${total.toFixed(2)}</p>
          <p className={`text-sm font-medium ${
            status === "credit" ? "text-green-600" : 
            status === "debit" ? "text-red-600" : 
            "text-gray-600"
          }`}>
            {status === "credit" ? "Credit: " : status === "debit" ? "Debit: " : "Balance: "}
            ${Math.abs(balance / 2).toFixed(2)}
          </p>
        </div>
        <Button
          variant={isActive ? "secondary" : "default"}
          className="mt-4 w-full"
          onClick={onToggleDropdown}
        >
          {isActive ? "Cancel" : `Add Expense as ${user === "Attiq" ? "Attiq" : "Ahsan"}`}
        </Button>
      </Card>
      
      {isActive && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 glass-card z-50 animate-fade-in shadow-xl">
          <ExpenseForm
            inputs={inputs}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
          />
        </Card>
      )}
    </div>
  );
});

WalletCard.displayName = "WalletCard";

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    // Load expenses from localStorage on initial render
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      const parsedExpenses = JSON.parse(savedExpenses);
      // Convert string dates back to Date objects
      return parsedExpenses.map((expense: any) => ({
        ...expense,
        date: new Date(expense.date)
      }));
    }
    return [];
  });

  const [expenseInputs, setExpenseInputs] = useState<Record<"Attiq" | "Ahsan", ExpenseInput>>({
    Attiq: { amount: "", description: "" },
    Ahsan: { amount: "", description: "" }
  });
  const [activeDropdown, setActiveDropdown] = useState<"Attiq" | "Ahsan" | null>(null);
  const { toast } = useToast();

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const calculateTotal = (user: "Attiq" | "Ahsan") => {
    return expenses
      .filter((expense) => expense.user === user)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const AttiqTotal = calculateTotal("Attiq");
  const AhsanTotal = calculateTotal("Ahsan");
  const difference = Math.abs(AttiqTotal - AhsanTotal);
  const whoOwes = AttiqTotal > AhsanTotal ? "Ahsan" : "Attiq";

  const updateExpenseInput = (user: "Attiq" | "Ahsan", field: keyof ExpenseInput, value: string) => {
    setExpenseInputs(prev => ({
      ...prev,
      [user]: {
        ...prev[user],
        [field]: value
      }
    }));
  };

  const addExpense = (user: "Attiq" | "Ahsan") => {
    const { amount, description } = expenseInputs[user];
    
    if (!amount || !description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      user,
      date: new Date(),
    };

    setExpenses([newExpense, ...expenses]);
    setExpenseInputs(prev => ({
      ...prev,
      [user]: { amount: "", description: "" }
    }));
    setActiveDropdown(null);
    
    toast({
      title: "Success",
      description: "Expense added successfully",
    });
  };

  const downloadExpenses = () => {
    const expensesData = JSON.stringify(expenses, null, 2);
    const blob = new Blob([expensesData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Expenses downloaded successfully",
    });
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2 animate-fade-in">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
          SpendWise Buddy
        </h1>
        <p className="text-muted-foreground">Track and split expenses effortlessly</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <WalletCard
          user="Attiq"
          total={AttiqTotal}
          otherUserTotal={AhsanTotal}
          isActive={activeDropdown === "Attiq"}
          inputs={expenseInputs.Attiq}
          onToggleDropdown={() => setActiveDropdown(activeDropdown === "Attiq" ? null : "Attiq")}
          onInputChange={(field, value) => updateExpenseInput("Attiq", field, value)}
          onSubmit={() => addExpense("Attiq")}
        />
        <WalletCard
          user="Ahsan"
          total={AhsanTotal}
          otherUserTotal={AttiqTotal}
          isActive={activeDropdown === "Ahsan"}
          inputs={expenseInputs.Ahsan}
          onToggleDropdown={() => setActiveDropdown(activeDropdown === "Ahsan" ? null : "Ahsan")}
          onInputChange={(field, value) => updateExpenseInput("Ahsan", field, value)}
          onSubmit={() => addExpense("Ahsan")}
        />
      </div>

      <Card className="p-6 glass-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Balance Summary</h2>
          </div>
          <Button 
            variant="outline" 
            onClick={downloadExpenses}
            className="flex items-center gap-2"
          >
            Download Expenses
          </Button>
        </div>
        {difference > 0 ? (
          <p className="text-lg">
            <span className="font-semibold">{whoOwes}</span> owes{" "}
            <span className="text-primary font-bold">${(difference / 2).toFixed(2)}</span>
          </p>
        ) : (
          <p className="text-lg">All expenses are currently split evenly!</p>
        )}
      </Card>

      <Card className="p-6 glass-card">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Recent Expenses</h2>
        </div>
        <div className="space-y-4">
          {expenses.slice(0, 5).map((expense) => (
            <div
              key={expense.id}
              className="flex justify-between items-center p-3 bg-secondary rounded-lg animate-fade-in"
            >
              <div>
                <p className="font-semibold">{expense.description}</p>
                <p className="text-sm text-muted-foreground">
                  {expense.user === "Attiq" ? "Attiq" : "Ahsan"} •{" "}
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
              <p className="font-bold">${expense.amount.toFixed(2)}</p>
            </div>
          ))}
          {expenses.length === 0 && (
            <p className="text-center text-muted-foreground">No expenses yet</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Index;
