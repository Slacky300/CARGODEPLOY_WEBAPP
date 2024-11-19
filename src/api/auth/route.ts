import { currentUser, EmailAddress } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/api/v1';

interface UserFromClerk {
  id: string;
  imageUrl: string;
  emailAddresses: EmailAddress[];
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}

const checkUserExistsInBackend = async (userId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
    });
    if (!res.ok) throw new Error(`Failed to check user existence. Status: ${res.status}`);
    const data = await res.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw new Error('Failed to check user existence.');
  }
};

const syncUserToBackend = async (user: UserFromClerk): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    if (!res.ok) throw new Error(`Failed to sync user. Status: ${res.status}`);
    const { success } = await res.json();
    return success;
  } catch (error) {
    console.error('Error syncing user to backend:', error);
    throw new Error('Failed to sync user.');
  }
};

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.redirect('/login');
    }

    const exists = await checkUserExistsInBackend(user.id);
    if (!exists) {
      return NextResponse.redirect('/register');
    }

    const { id, imageUrl, emailAddresses, firstName, lastName, username } = user;
    const success = await syncUserToBackend({ id, imageUrl, emailAddresses, firstName, lastName, username });

    if (success) {
      return NextResponse.redirect('/dashboard');
    } else {
      return NextResponse.json({ error: 'Failed to sync user data.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error handling user sync:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
