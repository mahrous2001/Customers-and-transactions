$(document).ready(function () {
  let currentChart = null; // Variable to hold the current chart

  async function fetchData() {
    try {
      const customersResponse = await fetch("http://localhost:5000/customers");
      const customers = await customersResponse.json(); // ==>Array

      const transactionsResponse = await fetch(
        "http://localhost:5000/transactions"
      );
      const transactions = await transactionsResponse.json(); //  ==>Array

      populateTable(customers, transactions);

      // Add event listeners for filtering
      $("#nameFilter").on("input", function () {
        $("#amountFilter").val(""); // Clear the amount filter when name filter changes
        $(".chart-container").hide(); // Hide chart container when inputs change
        populateTable(customers, transactions);
      });

      $("#amountFilter").on("input", function () {
        $("#nameFilter").val(""); // Clear the name filter when amount filter changes
        $(".chart-container").hide(); // Hide chart container when inputs change
        populateTable(customers, transactions);
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  function populateTable(customers, transactions) {
    const tableBody = $("#customerTable");
    tableBody.empty();

    const nameFilter = $("#nameFilter").val().toLowerCase();
    const amountFilter = $("#amountFilter").val();

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const customerTransactions = transactions.filter(function (transaction) {
        return transaction.customer_id == customer.id;
      });

      let transactionDetails = "";
      let hasMatchingTransaction = false;
      const dailyTransactions = {}; // Object to store daily transaction amounts

      for (let j = 0; j < customerTransactions.length; j++) {
        const transaction = customerTransactions[j];
        if (amountFilter && transaction.amount != amountFilter) {
          continue; // Skip transaction if amount is not equal to entered value
        }

        transactionDetails +=
          transaction.date + ": $" + transaction.amount + "<br>";
        hasMatchingTransaction = true;

        // Extract date (year-month-day) and update dailyTransactions object
        const transactionDate = new Date(transaction.date).toLocaleDateString();
        if (dailyTransactions[transactionDate]) {
          dailyTransactions[transactionDate] += transaction.amount;
        } else {
          dailyTransactions[transactionDate] = transaction.amount;
        }
      }

      if (
        customer.name.toLowerCase().includes(nameFilter) &&
        hasMatchingTransaction
      ) {
        const row = `
          <tr>
            <td>${customer.name}</td>
            <td>${transactionDetails}</td>
            <td><button class="btn btn-primary" data-customer-id="${
              customer.id
            }" data-daily-transactions='${JSON.stringify(
          dailyTransactions
        )}'> Chart </button></td>
          </tr>
        `;
        tableBody.append(row);
      }
    }

    // Add click event listener for chart button
    $(".btn-primary").click(function () {
      const customerId = $(this).data("customer-id");
      const dailyTransactions = $(this).data("daily-transactions"); // Get daily transactions for the clicked customer

      // Clear existing chart
      if (currentChart) {
        currentChart.destroy(); // Destroy the existing chart
      }

      showTransactionChart(customerId, dailyTransactions);
    });
  }

  function showTransactionChart(customerId, dailyTransactions) {
    const chartContainer = document.getElementById("transactionChart");
    const chartCtx = chartContainer.getContext("2d");

    // Prepare chart data (labels and corresponding amounts)
    const chartLabels = Object.keys(dailyTransactions);
    const chartData = Object.values(dailyTransactions);

    currentChart = new Chart(chartCtx, {
      type: "bar",
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: "Daily Transaction Amounts",
            data: chartData,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    });
    // Show the chart container
    $(".chart-container").show();
  }

  fetchData();
});
