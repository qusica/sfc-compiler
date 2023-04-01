<template>
	<div class="body panel">
		<div class="pills-toolbar" style="gap: 5px;">
			<button class="btn-primary" @click="doAdd">添加接待师傅</button>
			<button class="btn-danger" @click="doDel">删除接待师傅</button>
		</div>
		<div class="teacher-app">
			<div v-for="group in app.map" class="group-panel">
				<div class="group-name">{{ group.name }}</div>
				<div class="group-campus">
					<div class="campus-panel" v-for="campus in group.campus">
						<div class="campus-name">{{ campus.name }}</div>
						<div class="teacher-list">
							<div class="teader" v-for="teacher in campus.list">{{ teacher.name }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<style scoped>
	.teacher-app{
		display: grid;
		grid-template-columns: repeat(v-bind(productCount),1fr);
	}
	.group-campus{
		display: flex;
	}
	.teacher-list{
		display: flex;

	}
</style>
<script>
import API from '/newjs/common/api.mjs'
import { useConfig } from '/newjs/common/config.mjs'
import { openDataEditor } from '/newjs/common/DataEditor.mjs'
import { createElementVNode, resolveComponent, openBlock, createElementBlock, withDirectives, createVNode,vModelText, reactive } from '/newjs/vue.js'
import Message from '/newjs/common/Message.mjs'
import Modal from '../../newjs/common/Modal.mjs'
import { handleErrorMessage } from '../../newjs/common/widgets.mjs'
import { VSelect } from '../../newjs/common/widgets.mjs'

class App{
	constructor(list,productList,campusList){
		const map = {};
		productList.forEach(p=>{
			map[p.value] = new Group(p.name,campusList);
		})
		list.forEach(t=>{
			map[t.product_id] && map[t.product_id].add(t)
		})
		this.map = map;
	}

	add(t){
		this.map[t.product_id] && this.map[t.product_id].add(t)
	}
	
	remove(t){
		this.map[t.product_id] && this.map[t.product_id].remove(t)
	}
}
class Group{
	constructor(name,campusList){
		this.name = name;
		this.campus = campusList.map(({id,name})=>new Campus(id,name));
	}

	add(teacher){
		this.findThen(teacher,(c,t)=>c.add(t))
	}

	remove(teacher){
		this.findThen(teacher,(c,t)=>c.remove(t))
	}

	findThen(teacher,callback){
		const c = this.campus.find(c=>c.id == teacher.campus_id);
		if(c){
			callback(c,teacher)
		}
	}
}

class Campus{
	constructor(id,name){
		this.id = id;
		this.name = name;
		this.list = [];
	}
	add(teacher){
		this.list.push(teacher)
	}
	remove(teacher){
		const i = this.list.findIndex(t=>t.id == teacher.id);
		if(i > -1){
			this.list.splice(i,1)
		}
	}
}


export default {
	name: "TeacherIndex",
	suspenseText: '正在加载配置...',
	async setup() {
		const api = API.createModule('setting.Teacher', 'list');
		const { power, resource:{campus:{list:campusList},productOptions:productList}, teacherList } = 
		await Promise.all([useConfig({
			power: {
				edit: 'Teacher/edit', del: 'Teacher/del'
			},
			resource: ['campus', 'productOptions']
		}),api.load()]).then(([config,teacherList])=>{
			return {...config,teacherList};
		});		
		const campusMap = campusList.reduce((m, { id, name }) => (m[id] = name, m), {})
		const productMap = productList.reduce((m, { name, value }) => (m[value] = name, m), {})		
		Editor.config.init(campusList, productList)
		const app = reactive(new App(teacherList,productList,[{id:0,name:'无校区'},...campusList]))
		return {
			productCount:productList.length,
			app,
			power,
			doAdd() {
				openDataEditor(Editor, { product_id: 0, campus_id: 0 }, {
					title: '添加接待师傅', submitText: '确定',
					onSubmit(data) {
						return api.copy('add').save(data).then(record => {
							table.value.addRow(record, true);
							Message.success('接待师傅添加成功！')
						})
					}
				})
			},
			doEdit(data) {
				openDataEditor(Editor, { ...data }, {
					title: '修改接待师傅', submitText: '确定',
					onSubmit(form) {
						return api.copy('edit').save(form).then(record => {
							Object.assign(data, record);
							Message.success('接待师傅修改成功！')
						})
					}
				})
			},
			doDel() {
				const id = table.value.getSelected();
				if (id.length == 0) {
					return Modal.error('请选择要删除的接待师傅！')
				}
				let content = `是否确认删除选择的<b class="text-warn">${id.length}</b>个接待师傅？<br><span class="text-error">注意：数据删除不能恢复！</span>`
				Modal.confirm({ content, html: true })
					.then(() => {
						api.copy('del').jsonData({ id }).then(() => {
							table.value.deleteByIdList(id)
							Message.success('删除成功！')
						}).catch(handleErrorMessage)
					})
			}
		}
	}
}



const _static_1 = { class: "grid-form" }
const _static_2 = /*#__PURE__*/createElementVNode("label", { class: "form-label" }, "师傅姓名", -1 /* static */)
const _static_3 = /*#__PURE__*/createElementVNode("label", { class: "form-label" }, "绑定产品", -1 /* static */)
const _static_4 = /*#__PURE__*/createElementVNode("label", { class: "form-label" }, "绑定校区", -1 /* static */)
const Editor = {
	config: {
		ok: false,
		campusList: [],
		productList: [],
		init(campusArray, productArray) {
			if (this.campusList.length === 0) {
				this.campusList = campusArray.map(({ id: value, name }) => ({ name, value }));
				this.productList = productArray;
			}
		}
	},
	components: { VSelect },
	props: {
		data: Object
	},
	setup(props, { expose }) {
		const { campusList, productList } = Editor.config;
		expose({
			validate(data) {
				if (!(data.product_id > 0)) {
					return '绑定产品必须选择！'
				}
			}
		})
		return { campusList, productList };
	},
	render(_ctx, _cache) {
		const _component_VSelect = resolveComponent("VSelect")

		return (openBlock(), createElementBlock("div", _static_1, [
			_static_2,
			withDirectives(createElementVNode("input", {
				type: "text",
				class: "form-input",
				"onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.data.name) = $event))
			}, null, 512 /* NEED_PATCH */), [[vModelText, _ctx.data.name]]),
			_static_3,
			createVNode(_component_VSelect, {
				options: _ctx.productList,
				modelValue: _ctx.data.product_id,
				"onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.data.product_id) = $event)),
				"default-value": "选择绑定产品",
				"default-model-value": "0"
			}, null, 8 /* PROPS */, ["options", "modelValue"]),
			_static_4,
			createVNode(_component_VSelect, {
				options: _ctx.campusList,
				modelValue: _ctx.data.campus_id,
				"onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.data.campus_id) = $event)),
				"default-value": "选择绑定校区",
				"default-model-value": "0"
			}, null, 8 /* PROPS */, ["options", "modelValue"])
		]))
	},
	template: `
		<div class="grid-form">
			<label class="form-label">师傅姓名</label><input type="text" class="form-input" v-model="data.name"/>
            <label class="form-label">绑定产品</label><VSelect :options="productList" v-model="data.product_id" default-value="选择绑定产品" default-model-value="0"/>
            <label class="form-label">绑定校区</label><VSelect :options="campusList" v-model="data.campus_id"  default-value="选择绑定校区" default-model-value="0"/>
		</div>
	`
}

</script>