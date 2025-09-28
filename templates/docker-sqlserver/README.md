# Start container
```bash
docker run -it -d \
  -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 \
  --name sql-server \
  mcr.microsoft.com/mssql/server:2022-latest
```

# Check if successful
```bash
docker logs sql-server
docker exec -it sql-server /opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P 'YourPassword123!' -C -Q 'SELECT @@VERSION'
```

# To access with root user
```bash
docker exec -it --user root sql-server bash
```

# Run example SQL scripts

For example, file `example-sql.sql`:
```sql
CREATE DATABASE SampleDB;
GO

USE SampleDB;
GO

CREATE TABLE Products (
    ProductID int IDENTITY(1,1) PRIMARY KEY,
    ProductName varchar(100) NOT NULL,
    Price decimal(10,2),
    CreatedDate datetime DEFAULT GETDATE()
);
GO

INSERT INTO Products (ProductName, Price)
VALUES 
    ('Laptop', 999.99),
    ('Mouse', 25.50),
    ('Keyboard', 79.99);
GO

SELECT * FROM Products;
GO
```

```bash
/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P 'sqlserverttYK251020*' -C  -i /dev/stdin < example-sql.sql
```
