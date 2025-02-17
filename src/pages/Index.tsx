
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, WalletCards, ArrowLeftRight, History, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  amount: number;
  description: string;
  user: "person1" | "person2";
  date: Date;
}

interface ExpenseInput {
  amount: string;
  description: string;
}

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseInputs, setExpenseInputs] = useState<Record<"person1" | "person2", ExpenseInput>>({
    person1: { amount: "", description: "" },
    person2: { amount: "", description: "" }
  });
  const [activeDropdown, setActiveDropdown] = useState<"person1" | "person2" | null>(null);
  const { toast } = useToast();

  const calculateTotal = (user: "person1" | "person2") => {
    return expenses
      .filter((expense) => expense.user === user)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const person1Total = calculateTotal("person1");
  const person2Total = calculateTotal("person2");
  const difference = Math.abs(person1Total - person2Total);
  const whoOwes = person1Total > person2Total ? "Person 2" : "Person 1";

  const updateExpenseInput = (user: "person1" | "person2", field: keyof ExpenseInput, value: string) => {
    setExpenseInputs(prev => ({
      ...prev,
      [user]: {
        ...prev[user],
        [field]: value
      }
    }));
  };

  const addExpense = (user: "person1" | "person2") => {
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

  const WalletCard = ({ user, total }: { user: "person1" | "person2"; total: number }) => {
    const isActive = activeDropdown === user;
    const otherUserTotal = user === "person1" ? person2Total : person1Total;
    const balance = total - otherUserTotal;
    const status = balance === 0 ? "neutral" : balance > 0 ? "credit" : "debit";
    
    return (
      <div className="relative">
        <Card className="p-6 glass-card hover-scale">
          <div className="flex items-center gap-2 mb-4">
            <WalletCards className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{user === "person1" ? "Person 1" : "Person 2"}'s Wallet</h2>
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
            onClick={() => setActiveDropdown(isActive ? null : user)}
          >
            {isActive ? "Cancel" : `Add Expense as ${user === "person1" ? "Person 1" : "Person 2"}`}
          </Button>
        </Card>
        
        {isActive && (
          <Card className="absolute top-full left-0 right-0 mt-2 p-4 glass-card z-50 animate-fade-in shadow-xl">
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Amount"
                value={expenseInputs[user].amount}
                onChange={(e) => updateExpenseInput(user, "amount", e.target.value)}
              />
              <Input
                placeholder="Description"
                value={expenseInputs[user].description}
                onChange={(e) => updateExpenseInput(user, "description", e.target.value)}
              />
              <Button className="w-full" onClick={() => addExpense(user)}>
                Add Expense
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
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
        <WalletCard user="person1" total={person1Total} />
        <WalletCard user="person2" total={person2Total} />
      </div>

      <Card className="p-6 glass-card">
        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Balance Summary</h2>
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
                  {expense.user === "person1" ? "Person 1" : "Person 2"} •{" "}
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
