import React, { Component } from 'react'
import { connect } from 'react-redux'
import ProductAddUI from '../component/product/product-add'
import {Form,message} from 'antd'
import {reqCategoryData,reqAddOrUpdateProduct} from '../api'
import {getFileListAction} from '../actions/actionOperations/action-picture-wall-operation';

export class ProductAdd extends Component {
    constructor(props){
        super(props)
        this.state={
            options:[],
            name:null,
            desc:null,
            detail:null,
            price:null,
            imgs:null,
            categoryId:null,
            pCategoryId:null,
            status:"add"
        }
        // this.pw = React.createRef();
        this.editor = React.createRef();
    }
    /*表单价格自定义验证函数*/
    validatorPrice = (rule,value,callback)=>{
        let valueNum = Number(value);
        if(valueNum > 0){
            callback()
        }else if(valueNum === 0){
            callback("价格不能为0")
        }else{
            callback("价格不能为负数")
        }
    }
    /*表单提交事件*/
    submitAddProduct = () =>{
        this.props.form.validateFields(async (err, values) => {
          if (!err) {
            this.props.getFileList()/*发送action请求获取图片数组*/
            const {nowFileList} = this.props;
            const imgs = nowFileList.map(file=>file.name); /*得到图片的名称*/
            const detail = this.editor.current.getDetail()
            /*1,收集数据，并且封装成product对象*/
            const {name,desc,price,categoryIds/*得到的是分类的id号*/} = values;
            /*categoryIds如果为长度为一，说明选中的分类是一级分类，如果大于1说明选中了的是二级分类*/
            let pCategoryId,categoryId;
            if(categoryIds.length === 1){
                pCategoryId = "0";
                categoryId = categoryIds[0]
            }else{
                pCategoryId = categoryIds[0]
                categoryId = categoryIds[1]
            }
            const product = {name,desc,price,imgs,detail,pCategoryId,categoryId}
            /*如果是更新，需要添加_id*/
            if(this.state.status === "update"){
                product._id = this.product._id;
            }
            /*2,调用接口请求函数添加和更新*/ 
            const result = await reqAddOrUpdateProduct(product)
            if(result.status === 0){
                message.success(`${this.product._id ? "更新" : "添加"}商品成功`)
            }else{
                message.error(`${this.product._id ? "更新" : "添加"}商品失败`)
            }
          }
        });
    }
    /*级联选择器的回调函数*/
    loadData = async (selectedOptions)  =>{
        const targetOption = selectedOptions[0];
        targetOption.loading = true;
        /*加载二级菜单*/
        const result = await reqCategoryData(targetOption.value);
        targetOption.loading = false;
        const dataArr = result.data;
        if(dataArr && dataArr.length > 0){ /*当前选项存在二级菜单*/
            targetOption.children = dataArr.map(item=>({
                value: item._id,
                label: item.name,
                isLeaf: true,
            }))
        }else{/*当前选项没有二级菜单*/
            targetOption.isLeaf = true;
        }
    }
    /*请求函数请求到级联选择器的数据*/
    getCategorys = async (parentId)=>{
        const result = await reqCategoryData(parentId);
        if(result.status === 0){ /*数据请求成功*/
            const dataArr = result.data;
            // 如果是一级分类列表
            if (parentId==='0') {
                this.initOptions(dataArr);
            } else { // 二级列表
                return dataArr  // 返回二级列表 ==> 当前async函数返回的promsie就会成功且value为categorys
            }
        }else{/*数据请求失败*/
            message.error("数据请求失败");
        }
    }
    /*初始化级联选择器数组*/
    initOptions = async (dataArr)=>{
        const categorys = dataArr.map(item=>({
            value: item._id,
            label: item.name,
            isLeaf: false,
        }))
        //如果是二级分类商品的更新
        const {status,pCategoryId} = this.state
        if(status === "update" && pCategoryId !== '0'){
           const subCategorys = await this.getCategorys(pCategoryId)
           console.log("subCategorys===>",subCategorys)
           //生成二级下拉列表
           const childOptions = subCategorys.map(item=>({
                    value: item._id,
                    label: item.name,
                    isLeaf: true,
           }))
           //关联到对应的一级option上
           const targetOption = categorys.find(category => category.value === pCategoryId)
           targetOption.children = childOptions;
        }
        this.setState({
            options:categorys
        })
    }
    /*返回上一级*/
    goBackToHome = ()=>{
        this.props.history.goBack();
    }
    /*ajax请求数据*/
    componentDidMount() {
        this.getCategorys("0")
    }
    UNSAFE_componentWillMount(){
        this.product = this.props.location.state;
        if(!this.product){
            this.product = {}
            this.setState({
                status:"add"
            })
        }else{
            this.setState({
                status:"update"
            })
        }
        if(this.product instanceof Object){
            const {name,desc,detail,price,imgs,pCategoryId,categoryId} = this.product
            this.setState({
                name,
                desc,
                detail,
                price,
                imgs,
                pCategoryId,
                categoryId
            })
        }
    }
    render() {
        const { getFieldDecorator } = this.props.form;
        let {
            name,
            desc,
            detail,
            price,
            imgs,
            categoryId,
            pCategoryId,
        }=this.state
        return (
            <ProductAddUI 
                getFieldDecorator={getFieldDecorator}
                submitAddProduct={this.submitAddProduct}
                validatorPrice={this.validatorPrice}
                options={this.state.options}
                loadData={this.loadData}
                goBackToHome={this.goBackToHome}
                // pw={this.pw}
                editor={this.editor}
                name={name}
                desc={desc}
                detail={detail}
                price={price}
                imgs={imgs}
                pCategoryId={pCategoryId}
                categoryId={categoryId}
            />
        )
    }
}

const mapStateToProps = (state) => ({
    nowFileList:state.pictureWall.fileList
})

const mapDispatchToProps = (dispatch)=>({
    getFileList:()=>{/*得到当前上传成功的图片名称*/
        dispatch(getFileListAction())
    }
})
const ProductAddForm = Form.create({})(ProductAdd);
export default connect(mapStateToProps, mapDispatchToProps)(ProductAddForm)
