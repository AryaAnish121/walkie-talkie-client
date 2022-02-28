import Head from 'next/head';
import styles from '../styles/Home.module.css';
import apiBaseUrl from '../components/apiBaseUrl';
import Router from 'next/router';

export default function Home() {
  const handleClick = async () => {
    const res = await fetch(`${apiBaseUrl}/create-room`);
    const data = await res.json();

    if (res.status === 200) {
      Router.push(`/talk/${data.roomId}`);
    } else {
      alert(data.message);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>WALKIEtalkie</title>
        <meta name="description" content="Talk With WALKIEtalkie" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <img src="/walkietalkie.png" className={styles.walkieTalkieImg} />
      <button className={styles.createRoom} onClick={handleClick}>
        Create a room
      </button>
    </div>
  );
}
