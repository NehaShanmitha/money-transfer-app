import pymysql
import snowflake.connector
from snowflake.connector.pandas_tools import pd_writer
import pandas as pd
from sqlalchemy import create_engine
import datetime
from urllib.parse import quote_plus

# --- CONFIGURATION ---
password = quote_plus("Cloud@123$")
MYSQL_URI = f"mysql+pymysql://root:{password}@127.0.0.1/money_db"

SNOWFLAKE_CONFIG = {
    'user': 'Neha',
    'password': 'Snowflake@Neha123',
    'account': 'pyfxlle-cgc84412',
    'warehouse': 'COMPUTE_WH',
    'database': 'MONEY_DB',
    'schema': 'ANALYTICS',
    'role': 'ACCOUNTADMIN'
}

sf_password = quote_plus(SNOWFLAKE_CONFIG['password'])
SNOWFLAKE_URI = (
    f"snowflake://{SNOWFLAKE_CONFIG['user']}:{sf_password}@{SNOWFLAKE_CONFIG['account']}/"
    f"{SNOWFLAKE_CONFIG['database']}/{SNOWFLAKE_CONFIG['schema']}?"
    f"warehouse={SNOWFLAKE_CONFIG['warehouse']}&role={SNOWFLAKE_CONFIG['role']}"
)

def get_col(df, options):
    for opt in options:
        if opt in df.columns:
            return opt
    return None

def normalize_datetime_col(df, col):
    """Convert a datetime column to timezone-naive, formatted string, then back to datetime."""
    df[col] = pd.to_datetime(df[col])
    if df[col].dt.tz is not None:
        df[col] = df[col].dt.tz_localize(None)
    df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
    df[col] = pd.to_datetime(df[col])
    return df

def run_etl():
    print("--- 1. Extracting from MySQL ---")
    try:
        engine = create_engine(MYSQL_URI)
        df_users_raw     = pd.read_sql("SELECT * FROM users", engine)
        df_accounts_raw  = pd.read_sql("SELECT * FROM accounts", engine)
        df_trans_raw     = pd.read_sql("SELECT * FROM transaction_logs", engine)
        df_rewards_raw   = pd.read_sql("SELECT * FROM reward_logs", engine)
        print(f"Data Found: {len(df_users_raw)} Users, {len(df_accounts_raw)} Accounts, "
              f"{len(df_trans_raw)} Transaction Logs, {len(df_rewards_raw)} Reward Logs")
    except Exception as e:
        print(f"MySQL Error: {e}")
        return

    print("--- 2. Transforming for Snowflake ---")
    try:
        # DIM_USERS
        df_users = df_users_raw[['id', 'username', 'role']].copy()
        df_users.columns = ['USER_ID', 'USERNAME', 'ROLE']

        # DIM_ACCOUNTS
        h_name = get_col(df_accounts_raw, ['holder_name', 'holderName'])
        u_id   = get_col(df_accounts_raw, ['user_id', 'userId'])
        df_accounts = df_accounts_raw[['id', h_name, 'balance', 'status', u_id]].copy()
        df_accounts.columns = ['ACCOUNT_ID', 'HOLDER_NAME', 'BALANCE', 'STATUS', 'USER_ID']

        # FACT_TRANSACTIONS
        f_acc = get_col(df_trans_raw, ['from_account_id', 'fromAccountId'])
        t_acc = get_col(df_trans_raw, ['to_account_id', 'toAccountId'])
        c_on  = get_col(df_trans_raw, ['created_on', 'createdOn'])

        df_trans = df_trans_raw[['id', f_acc, t_acc, 'amount', 'status', c_on]].copy()
        df_trans = df_trans.rename(columns={
            'id': 'TRANSACTION_ID',
            f_acc: 'FROM_ACCOUNT_ID',
            t_acc: 'TO_ACCOUNT_ID',
            'amount': 'AMOUNT',
            'status': 'STATUS',
            c_on: 'CREATED_ON'
        })
        df_trans = normalize_datetime_col(df_trans, 'CREATED_ON')
        df_trans['DATE_KEY'] = pd.to_datetime(df_trans['CREATED_ON']).dt.date
        df_trans.columns = [x.upper() for x in df_trans.columns]

        # FACT_REWARDS  ← new
        r_c_on = get_col(df_rewards_raw, ['created_on', 'createdOn'])
        r_uid  = get_col(df_rewards_raw, ['user_id', 'userId'])
        r_tid  = get_col(df_rewards_raw, ['transaction_id', 'transactionId'])
        r_pts  = get_col(df_rewards_raw, ['points_earned', 'pointsEarned'])

        df_rewards = df_rewards_raw[['id', r_uid, r_tid, r_pts, r_c_on]].copy()
        df_rewards = df_rewards.rename(columns={
            'id': 'REWARD_ID',
            r_uid: 'USER_ID',
            r_tid: 'TRANSACTION_ID',
            r_pts: 'POINTS_EARNED',
            r_c_on: 'CREATED_ON'
        })
        df_rewards = normalize_datetime_col(df_rewards, 'CREATED_ON')
        df_rewards['DATE_KEY'] = pd.to_datetime(df_rewards['CREATED_ON']).dt.date
        df_rewards.columns = [x.upper() for x in df_rewards.columns]

        # Uppercase all column names for consistency
        df_users.columns    = [x.upper() for x in df_users.columns]
        df_accounts.columns = [x.upper() for x in df_accounts.columns]

        print("Transformation complete")

    except Exception as e:
        print(f"Transformation Error: {e}")
        import traceback
        traceback.print_exc()
        return

    print("--- 3. Loading to Snowflake ---")
    try:
        sf_engine = create_engine(SNOWFLAKE_URI)

        with sf_engine.connect() as ctx:
            print("Uploading DIM_USERS...")
            df_users.to_sql("dim_users", ctx, index=False,
                            if_exists='replace', method=pd_writer)

            print("Uploading DIM_ACCOUNTS...")
            df_accounts.to_sql("dim_accounts", ctx, index=False,
                               if_exists='replace', method=pd_writer)

            print("Uploading FACT_TRANSACTIONS...")
            
            df_trans.to_sql("fact_transactions", ctx, index=False,
                            if_exists='replace', method=pd_writer)

            print("Uploading FACT_REWARDS...")          # ← new
            df_rewards.to_sql("fact_rewards", ctx, index=False,
                              if_exists='replace', method=pd_writer)

            

        print("SUCCESS: Snowflake Data Warehouse updated!")

    except Exception as e:
        print(f"Snowflake Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("ETL Script Started...")
    run_etl()
    print("ETL Script Finished.")