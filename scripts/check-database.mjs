import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// 读取 .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log('🔍 检查数据库表和函数...\n');

  // 1. 检查 interaction_logs 表
  console.log('1️⃣ interaction_logs 表:');
  const { error: logsErr } = await supabase
    .from('interaction_logs')
    .select('*')
    .limit(1);
  if (logsErr) {
    console.log('   ❌ 错误:', logsErr.message);
  } else {
    console.log('   ✅ 表存在');
  }

  // 2. 检查 daily_nominations 表
  console.log('\n2️⃣ daily_nominations 表:');
  const { error: nomsErr } = await supabase
    .from('daily_nominations')
    .select('*')
    .limit(1);
  if (nomsErr) {
    console.log('   ❌ 错误:', nomsErr.message);
  } else {
    console.log('   ✅ 表存在');
  }

  // 3. 检查 log_interaction 函数
  console.log('\n3️⃣ log_interaction 函数:');
  const { error: logFnErr } = await supabase.rpc('log_interaction', {
    p_room_id: 999999,
    p_game_day: 1,
    p_phase: 'DAY',
    p_action_type: 'VOTE'
  });
  if (logFnErr) {
    if (logFnErr.message.includes('violates foreign key')) {
      console.log('   ✅ 函数存在 (外键约束正常工作)');
    } else {
      console.log('   ❌ 错误:', logFnErr.message);
    }
  } else {
    console.log('   ✅ 函数存在');
  }

  // 4. 检查 check_nomination_eligibility 函数
  console.log('\n4️⃣ check_nomination_eligibility 函数:');
  const { data: checkFn, error: checkFnErr } = await supabase.rpc('check_nomination_eligibility', {
    p_room_id: 999999,
    p_game_day: 1,
    p_nominator_seat: 0
  });
  if (checkFnErr) {
    console.log('   ❌ 错误:', checkFnErr.message);
  } else {
    console.log('   ✅ 函数存在, 返回:', JSON.stringify(checkFn));
  }

  // 5. 检查 get_game_interactions 函数
  console.log('\n5️⃣ get_game_interactions 函数:');
  const { data: getFn, error: getFnErr } = await supabase.rpc('get_game_interactions', {
    p_room_id: 999999
  });
  if (getFnErr) {
    console.log('   ❌ 错误:', getFnErr.message);
  } else {
    console.log('   ✅ 函数存在, 返回:', JSON.stringify(getFn));
  }

  // 6. 检查 get_nomination_history 函数
  console.log('\n6️⃣ get_nomination_history 函数:');
  const { data: histFn, error: histFnErr } = await supabase.rpc('get_nomination_history', {
    p_room_id: 999999
  });
  if (histFnErr) {
    console.log('   ❌ 错误:', histFnErr.message);
  } else {
    console.log('   ✅ 函数存在, 返回:', JSON.stringify(histFn));
  }

  // 7. 检查 record_nomination 函数
  console.log('\n7️⃣ record_nomination 函数:');
  const { error: recFnErr } = await supabase.rpc('record_nomination', {
    p_room_id: 999999,
    p_game_day: 1,
    p_nominator_seat: 0,
    p_nominee_seat: 1
  });
  if (recFnErr) {
    if (recFnErr.message.includes('violates foreign key')) {
      console.log('   ✅ 函数存在 (外键约束正常工作)');
    } else {
      console.log('   ❌ 错误:', recFnErr.message);
    }
  } else {
    console.log('   ✅ 函数存在');
  }

  // 8. 检查 update_nomination_result 函数
  console.log('\n8️⃣ update_nomination_result 函数:');
  const { data: updFn, error: updFnErr } = await supabase.rpc('update_nomination_result', {
    p_room_id: 999999,
    p_game_day: 1,
    p_nominee_seat: 0,
    p_was_seconded: true,
    p_vote_count: 5,
    p_was_executed: false
  });
  if (updFnErr) {
    console.log('   ❌ 错误:', updFnErr.message);
  } else {
    console.log('   ✅ 函数存在, 返回:', updFn);
  }

  console.log('\n✨ 检查完成!');
}

checkDatabase().catch(console.error);
