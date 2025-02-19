import { useState, memo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, WalletCards, ArrowLeftRight, History, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Person {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  userId: string;
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
  person,
  total, 
  otherUsersTotal,
  isActive,
  inputs,
  onNameChange,
  onToggleDropdown,
  onInputChange,
  onSubmit,
  onDelete,
  totalPeople
}: { 
  person: Person;
  total: number;
  otherUsersTotal: number;
  isActive: boolean;
  inputs: ExpenseInput;
  onNameChange: (name: string) => void;
  onToggleDropdown: () => void;
  onInputChange: (field: keyof ExpenseInput, value: string) => void;
  onSubmit: () => void;
  onDelete: () => void;
  totalPeople: number;
}) => {
  const perPersonShare = (total + otherUsersTotal) / totalPeople;
  const balance = total - perPersonShare;
  const status = balance === 0 ? "neutral" : balance > 0 ? "credit" : "debit";
  
  return (
    <div className="relative group">
      <Card className="p-6 glass-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <WalletCards className="h-5 w-5 text-primary" />
            </div>
            <Input
              value={person.name}
              onChange={(e) => onNameChange(e.target.value)}
              className="font-semibold text-xl w-40 px-2 border-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          <div className="bg-secondary/30 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="text-3xl font-bold">${total.toFixed(2)}</p>
          </div>
          <div className="bg-secondary/30 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Your Share</p>
            <p className="text-xl font-semibold">${perPersonShare.toFixed(2)}</p>
          </div>
          <div className={`p-3 rounded-lg ${
            status === "credit" ? "bg-green-100" : 
            status === "debit" ? "bg-red-100" : 
            "bg-gray-100"
          }`}>
            <p className={`text-sm font-medium ${
              status === "credit" ? "text-green-600" : 
              status === "debit" ? "text-red-600" : 
              "text-gray-600"
            }`}>
              {status === "credit" ? "You'll Receive: " : 
               status === "debit" ? "You Owe: " : 
               "Balance: "}
              ${Math.abs(balance).toFixed(2)}
            </p>
          </div>
        </div>
        <Button
          variant={isActive ? "secondary" : "default"}
          className="mt-4 w-full transition-all duration-200 hover:shadow-md"
          onClick={onToggleDropdown}
        >
          {isActive ? "Cancel" : `Add Expense for ${person.name}`}
        </Button>
      </Card>
      
      {isActive && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 glass-card z-50 shadow-xl animate-fade-in">
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
  const [people, setPeople] = useState<Person[]>(() => {
    const savedPeople = localStorage.getItem('people');
    if (savedPeople) {
      return JSON.parse(savedPeople);
    }
    return [
      { id: '1', name: 'Person 1' },
      { id: '2', name: 'Person 2' }
    ];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      const parsedExpenses = JSON.parse(savedExpenses);
      return parsedExpenses.map((expense: any) => ({
        ...expense,
        date: new Date(expense.date)
      }));
    }
    return [];
  });

  const [expenseInputs, setExpenseInputs] = useState<Record<string, ExpenseInput>>(() => {
    return people.reduce((acc, person) => ({
      ...acc,
      [person.id]: { amount: "", description: "" }
    }), {});
  });

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const calculateTotal = (userId: string) => {
    return expenses
      .filter((expense) => expense.userId === userId)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const calculateBalances = () => {
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const perPersonShare = totalExpenses / people.length;
    
    return people.map(person => {
      const personTotal = calculateTotal(person.id);
      const balance = personTotal - perPersonShare;
      
      return {
        personId: person.id,
        personName: person.name,
        total: personTotal,
        balance: balance,
        shouldReceive: balance > 0,
        amount: Math.abs(balance)
      };
    });
  };

  const renderWalletCard = (person: Person) => {
    const total = calculateTotal(person.id);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const othersTotal = totalExpenses - total;

    return (
      <WalletCard
        key={person.id}
        person={person}
        total={total}
        otherUsersTotal={othersTotal}
        isActive={activeDropdown === person.id}
        inputs={expenseInputs[person.id]}
        onNameChange={(name) => updatePersonName(person.id, name)}
        onToggleDropdown={() => setActiveDropdown(activeDropdown === person.id ? null : person.id)}
        onInputChange={(field, value) => updateExpenseInput(person.id, field, value)}
        onSubmit={() => addExpense(person.id)}
        onDelete={() => deletePerson(person.id)}
        totalPeople={people.length}
      />
    );
  };

  const updateExpenseInput = (userId: string, field: keyof ExpenseInput, value: string) => {
    setExpenseInputs(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };

  const addPerson = () => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name: `Person ${people.length + 1}`
    };
    setPeople([...people, newPerson]);
    setExpenseInputs(prev => ({
      ...prev,
      [newPerson.id]: { amount: "", description: "" }
    }));
  };

  const updatePersonName = (personId: string, name: string) => {
    setPeople(people.map(p => 
      p.id === personId ? { ...p, name } : p
    ));
  };

  const deletePerson = (personId: string) => {
    if (people.length <= 2) {
      toast({
        title: "Error",
        description: "You must have at least two people",
        variant: "destructive",
      });
      return;
    }
    setPeople(people.filter(p => p.id !== personId));
    setExpenses(expenses.filter(e => e.userId !== personId));
    const { [personId]: _, ...restInputs } = expenseInputs;
    setExpenseInputs(restInputs);
  };

  const addExpense = (userId: string) => {
    const { amount, description } = expenseInputs[userId];
    
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
      userId,
      date: new Date(),
    };

    setExpenses([newExpense, ...expenses]);
    setExpenseInputs(prev => ({
      ...prev,
      [userId]: { amount: "", description: "" }
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {people.map(person => renderWalletCard(person))}
        <Button
          onClick={addPerson}
          className="h-full min-h-[200px] flex flex-col gap-2 border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors"
          variant="outline"
        >
          <Plus className="h-6 w-6" />
          Add Person
        </Button>
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
            <History className="h-4 w-4" />
            Download Expenses
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4 bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
              <p className="text-2xl font-bold">
                ${expenses.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
              </p>
            </Card>
            <Card className="p-4 bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-2">Share per Person ({people.length})</p>
              <p className="text-2xl font-bold">
                ${(expenses.reduce((acc, curr) => acc + curr.amount, 0) / people.length).toFixed(2)}
              </p>
            </Card>
          </div>
          <div className="space-y-3 mt-4">
            {calculateBalances().map(({ personId, personName, balance, shouldReceive, amount }) => (
              <div key={personId} className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="font-semibold">{personName}</span>
                <span className={`font-bold ${
                  shouldReceive ? "text-green-600" : 
                  balance < 0 ? "text-red-600" : 
                  "text-gray-600"
                }`}>
                  ${amount.toFixed(2)}
                  {shouldReceive ? " (to receive)" : balance < 0 ? " (to pay)" : " (settled)"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6 glass-card">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Recent Expenses</h2>
        </div>
        <div className="space-y-4">
          {expenses.slice(0, 5).map((expense) => {
            const person = people.find(p => p.id === expense.userId);
            return (
              <div
                key={expense.id}
                className="flex justify-between items-center p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div>
                  <p className="font-semibold">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {person?.name} • {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-bold">${expense.amount.toFixed(2)}</p>
              </div>
            );
          })}
          {expenses.length === 0 && (
            <p className="text-center text-muted-foreground">No expenses yet</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Index;
